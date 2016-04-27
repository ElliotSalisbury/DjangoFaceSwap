//taskId to img map
var taskMap = {};
var imgQueue = new PriorityQueue({ comparator: function(imgA, imgB) {
	return imgB.size-imgA.size;
}});

var HOST = "https://crowddrone.ecs.soton.ac.uk:9090";
var MAXSIZE = 512;
var MINSIZE = 100;

//lets load the user settings at the start, default values if settings havent been set
var ONOFF = true;
var PERCENTAGE = 1.0;
chrome.storage.sync.get({
		onoff: ONOFF,
		percentage: PERCENTAGE
	}, function(items) {
		ONOFF = items.onoff;
		PERCENTAGE = items.percentage;

		//start the faceswapping code
		initialize();
	});

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// mutation observer for if an image changes
var imgObserver = new MutationObserver(function(mutations) {
	//if it's turned off skip this observation
	if (ONOFF == false) {
		return;
	}

	mutations.forEach(function(mutation) {
		//we store the swapped data twice, to make sure that if the src is changing, its not because of me
		if(getSrcFromElement(mutation.target).hashCode() != mutation.target.hashedSrc) {
			startSwapTask(mutation.target);
		}

	});
});

// mutation observer for the whole DOM
var domObserver = new MutationObserver(function(mutations) {
	//if it's turned off skip this observation
	if (ONOFF == false) {
		return;
	}

    $("img:not('.SWAPPEDALREADY')").each(function(){
		//add the swapped class so we don't process this image again
		$(this).addClass("SWAPPEDALREADY");

		//register a MutationObserver incase the src externally changes
		var config = { characterData: true, attributes: true, attributeFilter: ["src"] };
		imgObserver.observe(this, config);

		startSwapTask(this);
	});

	$("*:not('.SWAPPEDALREADY')").filter(function(){ return this.style && this.style.backgroundImage}).each(function(){
		$(this).addClass("SWAPPEDALREADY");

		var config = { characterData: true, attributes: true, attributeFilter: ["style"] };
		imgObserver.observe(this, config);

		startSwapTask(this);
	});
});

function initialize() {
	var config = { childList: true, characterData: true, subtree: true };
	domObserver.observe(document.querySelector('body'), config);
	
	// var currMousPos = {x:0,y:0};
	// $( "body" ).mousemove(function(mevent){
	// 	currMousPos.x = mevent.clientX;
	// 	currMousPos.y = mevent.clientY;
	// });

	$( "body" ).on( "mouseenter mouseleave", "img, a:has(div):has(img)", function(event) {
		//depending on the event type, choose the new src we're going to temporarily display
		var newSrc = "originalSrc";
		if (event.type == "mouseleave") {
			newSrc = "faceSwappedSrc";
		}

		//depending on the selector, we may have an img or (because of facebook) an element that contains an img
		if (this instanceof HTMLImageElement) {
			if (typeof this[newSrc] != 'undefined') {
				setSrcOnElement(this,this[newSrc]);
			}
		}else {
			//get the child imgs
			$(this).find("img").each(function() {
				//check if mouse is inside img element
				// var bounds = this.getBoundingClientRect();
				// if (currMousPos.y > bounds.top && currMousPos.y < bounds.bottom && currMousPos.x > bounds.left && currMousPos.x < bounds.right) {
					if (typeof this[newSrc] != 'undefined') {
						setSrcOnElement(this,this[newSrc]);
					}
				// }
			});
		}
	});
}

//start the queue consumer
var queueConsumer = setInterval(consumeSwapTask,100);

//Good for debugging, hover over image and press a key
//$("img").hover(function() {
//	var thatImg = this;
//	$(document).keydown(function() {
//		//var config = { characterData: true, attributes: true, attributeFilter: ["src"] };
//		//imgObserver.observe(maxImage, config);
//		startSwapTask(thatImg);
//	});
//    }, function() {
//	   $(document).unbind("keydown");
//});


function getSrcFromElement(element) {
	if (element instanceof HTMLImageElement) {
		return element.src;
	}else if (element.style && element.style.backgroundImage) {
		var src = element.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
		return src;
	}
	return "";
}
function setSrcOnElement(element, src) {
	src = src.replace(/\n/g,"");
	if (element instanceof HTMLImageElement) {
		//ensure image doesnt resize when we set the new src
		var currentWidth = element.clientWidth;
		var currentHeight = element.clientHeight;
		element.src = src;
		element.width = currentWidth;
		element.height = currentHeight;
	}else if (element.style && element.style.backgroundImage) {
		$(element).css("background-image", "url("+src+")");
	}
	element.hashedSrc = src.hashCode();
}

function isBlacklisted(elementToSwap) {
	return $(elementToSwap).hasClass("spotlight"); //cant handle facebook spotlight for some reason (goes black when src modified)
}

function startSwapTask(elementToSwap) {
	//first check if we can swap this element
	if (isBlacklisted(elementToSwap)) {
		return;
	}

	//only swap PERCENTAGE of images
	if (Math.random() > PERCENTAGE) {
		return;
	}

	//we dont deal with gifs so next get the src from the element
	var src = getSrcFromElement(elementToSwap);
	if (src.toLowerCase().endsWith(".gif")) {
		return;
	}

	//create a new image to avoid cross site issues
	var img = new Image();
	img.setAttribute('crossOrigin', 'anonymous');
	img.src = src;

	img.onload = function() {
		//we need to draw the image to a canvas so we can get the imageData
		var canvas = document.createElement('CANVAS');
		var ctx = canvas.getContext('2d');

		//only render as much as we need to, check if client or natural is smaller
		if (elementToSwap instanceof HTMLImageElement && elementToSwap.clientWidth * elementToSwap.clientHeight < this.naturalWidth * this.naturalHeight) {
			canvas.width = elementToSwap.clientWidth;
			canvas.height = elementToSwap.clientHeight;
		} else {
			canvas.width = this.naturalWidth;
			canvas.height = this.naturalHeight;
		}

		//ensure image is less than max size
		if (canvas.width > MAXSIZE) {
			var ratio = MAXSIZE / canvas.width;
			canvas.width = MAXSIZE;
			canvas.height = canvas.height * ratio;
		}else if (canvas.height > MAXSIZE) {
			var ratio = MAXSIZE / canvas.height;
			canvas.height = MAXSIZE;
			canvas.width = canvas.width * ratio;
		}

		//what part of the source image should we use
		//TODO calculate rendered image from css background-image and background-position property
		var sx = 0;
		var sy = 0;
		var sw = this.naturalWidth;
		var sh = this.naturalHeight;

		//check the image is worth sending
		if (canvas.width < MINSIZE || canvas.height < MINSIZE || elementToSwap.clientWidth < MINSIZE || elementToSwap.clientHeight < MINSIZE) {
			return;
		}

		//draw our image
		ctx.drawImage(this, sx,sy,sw,sh, 0, 0, canvas.width, canvas.height);
		//get the image as base64
		var imageb64 = canvas.toDataURL("image/webp");

		//add the image to the queue to be sent off for processing later
		imgQueue.queue({"size":sw*sh,"b64":imageb64,"element":elementToSwap});

		//remove the canvas once done with it
		canvas = null;
	};
}

function consumeSwapTask() {
	if (imgQueue.length > 0) {
		var imgObj = imgQueue.dequeue();
		//send the image data off to be processed
		$.ajax({
			type: "POST",
			url: HOST + "/startSwap",
			cache: false,
			data: {
				imageb64: imgObj.b64
			},
			success: function (data) {
				//get the processing ID from the server
				var taskId = data;

				//associate the id with the original DOM element
				taskMap[taskId] = imgObj.element;

				//start polling to see if the processing is complete
				pollSwapTask(taskId);
			},
			error: function (data) {
				console.log("error contacting the faceswap server");
			}
		});
	}
}

function pollSwapTask(taskId) {
	setTimeout(function () {
		$.ajax({
			type: "GET",
			url: HOST+"/getSwap",
			cache: false,
			data: {
				taskId: taskId
			},
			success: function (data) {
				if (data.status == "FAILURE") {
					//this image cannot be swapped, probably no faces
					//console.log(data.status);

				}
				else if (data.status == "SUCCESS") {
					var element = taskMap[taskId];
					element.originalSrc = getSrcFromElement(element);
					element.faceSwappedSrc = data.image;

					setSrcOnElement(taskMap[taskId], data.image);
				} else {
					//all other status messages mean we should try again later
					pollSwapTask(taskId);
				}
			},
			error: function (data) {
				console.log("error polling the faceswap server");
			}
		});
	}, 100);
}