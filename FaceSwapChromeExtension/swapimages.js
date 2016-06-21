//taskId to img map
var taskMap = {};
var imgQueue = new PriorityQueue({ comparator: function(imgA, imgB) {
	return imgB.size-imgA.size;
}});

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
			newSrc = "swappedSrc";
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


	if (elementToSwap.clientWidth < MINSIZE || elementToSwap.clientHeight < MINSIZE) {
		return;
	}

	//we dont deal with gifs so next get the src from the element
	var src = getSrcFromElement(elementToSwap);
	if (!src || src.toLowerCase().endsWith(".gif")) {
		return;
	}

	imgQueue.queue({"src":src,"element":elementToSwap});
}

function consumeSwapTask() {
	if (imgQueue.length > 0) {
		var imgObj = imgQueue.dequeue();
		//send the image data off to be processed
		$.ajax({
			type: "POST",
			url: "https://www.captionbot.ai/api/message",
			cache: false,
			data: {
				"conversationId":"CAItAUhgbmj",
				"waterMark":"",
				"userMessage":imgObj.src},
			success: function (data) {
				data = JSON.parse(data);
				console.log(data);

				if(data.UserMessage) {
					var element = imgObj.element;

					//create a canvas to render text
					var canvas = document.createElement('CANVAS');
					var ctx = canvas.getContext('2d');
					canvas.width = element.clientWidth;
					canvas.height = element.clientHeight;

					//fill in black
					ctx.beginPath();
					ctx.rect(0, 0, canvas.width, canvas.height);
					ctx.fillStyle = "black";
					ctx.fill();
					
					//draw centered text
					ctx.fillStyle = "white";
					paint_centered_wrap(canvas,0,0,canvas.width,canvas.height,data.UserMessage,8,2);
					var textSrc = canvas.toDataURL();
					
					element.originalSrc = imgObj.src;
					element.swappedSrc = textSrc;

					setSrcOnElement(element, textSrc);
				}
			},
			error: function (data) {
				console.log("error contacting the captionbot server");
			}
		});
	}
}

/**
 * @param canvas : The canvas object where to draw .
 *                 This object is usually obtained by doing:
 *                 canvas = document.getElementById('canvasId');
 * @param x     :  The x position of the rectangle.
 * @param y     :  The y position of the rectangle.
 * @param w     :  The width of the rectangle.
 * @param h     :  The height of the rectangle.
 * @param text  :  The text we are going to centralize.
 * @param fh    :  The font height (in pixels).
 * @param spl   :  Vertical space between lines
 */
paint_centered_wrap = function(canvas, x, y, w, h, text, fh, spl) {
	// The painting properties
	// Normally I would write this as an input parameter
	var Paint = {
		VALUE_FONT : '12px Arial',
	}
	/*
	 * @param ctx   : The 2d context
	 * @param mw    : The max width of the text accepted
	 * @param font  : The font used to draw the text
	 * @param text  : The text to be splitted   into
	 */
	var split_lines = function(ctx, mw, font, text) {
		// We give a little "padding"
		// This should probably be an input param
		// but for the sake of simplicity we will keep it
		// this way
		mw = mw - 10;
		// We setup the text font to the context (if not already)
		ctx2d.font = font;
		// We split the text by words
		var words = text.split(' ');
		var new_line = words[0];
		var lines = [];
		for(var i = 1; i < words.length; ++i) {
			if (ctx.measureText(new_line + " " + words[i]).width < mw) {
				new_line += " " + words[i];
			} else {
				lines.push(new_line);
				new_line = words[i];
			}
		}
		lines.push(new_line);
		// DEBUG
		// for(var j = 0; j < lines.length; ++j) {
		//    console.log("line[" + j + "]=" + lines[j]);
		// }
		return lines;
	}
	// Obtains the context 2d of the canvas
	// It may return null
	var ctx2d = canvas.getContext('2d');
	if (ctx2d) {
		// Paint text
		var lines = split_lines(ctx2d, w, Paint.VALUE_FONT, text);
		// Block of text height
		var both = lines.length * (fh + spl);
		// We determine the y of the first line
		var ly = (h - both)/2 + y + spl*lines.length;
		var lx = 0;
		for (var j = 0, ly; j < lines.length; ++j, ly+=fh+spl) {
			// We continue to centralize the lines
			lx = x+w/2-ctx2d.measureText(lines[j]).width/2;
			// DEBUG
			ctx2d.fillText(lines[j], lx, ly);
		}
	} else {
		// Do something meaningful
	}
}