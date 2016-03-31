//taskId to img map
var taskMap = {};

var HOST = "https://crowddrone.ecs.soton.ac.uk:9090";
var MAXSIZE = 512;
var MINSIZE = 100;

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
	mutations.forEach(function(mutation) {
		//we store the swapped data twice, to make sure that if the src is changing, its not because of me
		if(getSrcFromElement(mutation.target).hashCode() != mutation.target.hashedSrc) {
			startSwapTask(mutation.target);
		}

	});
});

// mutation observer for the whole DOM
var domObserver = new MutationObserver(function(mutations) {
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
var config = { childList: true, characterData: true, subtree: true };
domObserver.observe(document.querySelector('body'), config);

//var maxImage;
//$("img:not('.SWAPPEDALREADY')").each(function(){
//	if (maxImage == undefined || maxImage.clientWidth*maxImage.clientHeight < this.clientWidth * this.clientHeight) {
//		maxImage = this;
//	}
//});
//var config = { characterData: true, attributes: true, attributeFilter: ["src"] };
//imgObserver.observe(maxImage, config);
//startSwapTask(maxImage);

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

function startSwapTask(elementToSwap) {
	//create a new image to avoid cross site issues
	var img = new Image();
	img.setAttribute('crossOrigin', 'anonymous');
	img.src = getSrcFromElement(elementToSwap);

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

		//send the image data off to be processed
		$.ajax({
			type: "POST",
			url: HOST+"/startSwap",
			cache: false,
			data: {
				imageb64: imageb64
			},
			success: function (data) {
				//get the processing ID from the server
				var taskId = data;

				//associate the id with the original DOM element
				taskMap[taskId] = elementToSwap;

				//start polling to see if the processing is complete
				pollSwapTask(taskId);
			},
			error: function (data) {
				console.log("error starting");
			}
		});

		//remove the canvas once done with it
		canvas = null;
	};
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
					//this image cannot be swapped, log the reason
					console.log(data.status);

				}
				else if (data.status == "SUCCESS") {
					setSrcOnElement(taskMap[taskId], data.image);
				} else {
					//all other status messages mean we should try again later
					pollSwapTask(taskId);
				}
			},
			error: function (data) {
				console.log("error polling");
			}
		});
	}, 100);
}