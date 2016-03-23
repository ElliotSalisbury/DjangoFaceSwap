function img_find() {
    var imgs = document.getElementsByTagName("img");
	var imgSrcs = [];
    for (var i = 0; i < imgs.length; i++) {
		var img = imgs[i];
		if (img.naturalWidth > 100 && img.naturalHeight > 100) {
			imgSrcs.push(img.src);
		}
    }
    return imgSrcs;
}
var imgSrcs = img_find();
console.log(imgSrcs);
var imagesjson = JSON.stringify(imgSrcs);

$.ajax({
	type: "GET",
	url: "http://127.0.0.1:8000/swap",
	cache: false,
	data: {
		imagesjson: imagesjson
	},
	success: function (data) {
		var imgs = document.getElementsByTagName("img");
		var imgSrcs = [];
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			if (img.src in data) {
				img.src = data[img.src];
			}
		}
		console.log(data)
	},
	error: function(data) {
		console.log("Could not swap images");
	}
});