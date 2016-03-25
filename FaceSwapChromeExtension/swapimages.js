// create an observer instance
var observer = new MutationObserver(function(mutations) {
    $("img:not('.SWAPPEDALREADY')").each(function(){
		//add the swapped class so we don't process this image again
		$(this).addClass("SWAPPEDALREADY");

		//avoid cross site scripting issues
		var img = new Image();
		img.setAttribute('crossOrigin', 'anonymous');
		img.src = this.src;

		var that = this;
		img.onload = function() {
			if (this.naturalHeight < 100 || this.naturalWidth < 100) {
				return;
			}
			//draw the image to a canvas so we can get the imageData
			var canvas = document.createElement('CANVAS');
			var ctx = canvas.getContext('2d');
			var dataURL;
			canvas.height = that.clientHeight;
			canvas.width = that.clientWidth;
			ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
			dataURL = canvas.toDataURL("image/jpg");

			//send the image data off to be processed
			$.ajax({
				type: "POST",
				url: "https://crowddrone.ecs.soton.ac.uk/swap",
				cache: false,
				data: {
					imageb64: dataURL
				},
				success: function (data) {
					if (data.success) {
						that.src = data.image;
					}else {
						console.log(data.msg);
					}

				},
				error: function(data) {
					console.log("Could not swap images");
				}
			});

			canvas = null;
		};
	});
});

// configuration of the observer:
var config = { childList: true, characterData: true, subtree: true };
// select the target node
var target = document.querySelector('body');
// pass in the target node, as well as the observer options
observer.observe(target, config);