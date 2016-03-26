//taskId to img map
var taskMap = {};

var HOST = "https://crowddrone.ecs.soton.ac.uk:9000";

function hashb64Img(imgb64) {
	//this is terrible right now
	return imgb64.substring(45, 65);
}

// mutation observer for if an image changes
var imgObserver = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		//we store the swapped data twice, to make sure that if the src is changing, its not because of me
		if(hashb64Img(getSrcFromElement(mutation.target)) != mutation.target.hashedSrc) {
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
	if (element instanceof HTMLImageElement) {
		element.src = src;
	}else if (element.style && element.style.backgroundImage) {
		$(element).css("background-image", "url("+src.replace(/\n/g,"")+")");
	}
	element.hashedSrc = hashb64Img(src);
}

function startSwapTask(elementToSwap) {
	//create a new image to avoid cross site issues
	var img = new Image();
	img.setAttribute('crossOrigin', 'anonymous');
	img.src = getSrcFromElement(elementToSwap);

	img.onload = function() {
		//check the image is worth sending
		if (this.naturalHeight < 100 || this.naturalWidth < 100) {
			return;
		}

		//draw the image to a canvas so we can get the imageData
		var canvas = document.createElement('CANVAS');
		var ctx = canvas.getContext('2d');

		//only render as much as we need to
		canvas.width = Math.min(elementToSwap.clientWidth, this.naturalWidth);
		canvas.height = Math.min(elementToSwap.clientHeight, this.naturalHeight);
		ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
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