function ajax(url, data, successcallback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onload = function() {
    	if (xhr.status === 200) {
        	successcallback(JSON.parse(xhr.responseText));
    	}
	};
	xhr.send(data);
}

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
var imagesjson = JSON.stringify(imgSrcs);

ajax("http://127.0.0.1:8000/swap",imagesjson,function (data) {
	console.log(data)
});