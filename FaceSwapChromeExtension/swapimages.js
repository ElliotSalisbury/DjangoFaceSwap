//taskId to img map
var taskMap = {};

// create an observer instance
var observer = new MutationObserver(function(mutations) {
    $("img:not('.SWAPPEDALREADY')").each(function(){
		//add the swapped class so we don't process this image again
		$(this).addClass("SWAPPEDALREADY");

		startSwapTask(this);
	});
});

// configuration of the observer:
var config = { childList: true, characterData: true, subtree: true };
// select the target node
var target = document.querySelector('body');
// pass in the target node, as well as the observer options
observer.observe(target, config);

function startSwapTask(elementToSwap) {
	//create a new image to avoid cross site issues
	var img = new Image();
	img.setAttribute('crossOrigin', 'anonymous');
	img.src = elementToSwap.src;

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
		var imageb64 = canvas.toDataURL("image/jpg");

		//send the image data off to be processed
		$.ajax({
			type: "POST",
			url: "http://127.0.0.1:8001/startSwap",
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
			url: "http://127.0.0.1:8001/getSwap",
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
					taskMap[taskId].src = data.image;
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