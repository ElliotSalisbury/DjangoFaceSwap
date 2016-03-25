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
			//draw the image to a canvas so we can get the imageData
			var canvas = document.createElement('CANVAS');
			var ctx = canvas.getContext('2d');
			var dataURL;
			canvas.height = this.height;
			canvas.width = this.width;
			ctx.drawImage(this, 0, 0);
			dataURL = canvas.toDataURL("image/jpg");

			//send the image data off to be processed
			$.ajax({
				type: "POST",
				url: "http://127.0.0.1:8000/swap",
				cache: false,
				data: {
					imageb64: dataURL
				},
				success: function (data) {
					that.src = data.image;
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

$("img").each(function(){
	var img = new Image();
	img.setAttribute('crossOrigin', 'anonymous');
	img.src = this.src;



});