function slideToNextActive(direction) {
    var currentActive = $("#example_carousel > ul > li.active");
    if (direction > 0) {
        var nextActive = $("#example_carousel > ul > li.active").next();
        if (nextActive.length > 0) {
            currentActive.removeClass("active");
            nextActive.addClass("active");
        }
    }else if (direction < 0) {
        var nextActive = $("#example_carousel > ul > li.active").prev();
        if (nextActive.length > 0) {
            currentActive.removeClass("active");
            nextActive.addClass("active");
        }
    }

    var newMidPoint = $("#example_carousel").width()/2;
    newMidPoint = newMidPoint - $("#example_carousel > ul > li.active").position().left;
    newMidPoint = newMidPoint - $("#example_carousel > ul > li.active img").width()/2;
    $("#example_carousel > ul").css("left",newMidPoint);
}

$(function() {
    $("#example_carousel > a.right.carousel-control").click(function() {
            slideToNextActive(1);
    });
    $("#example_carousel > a.left.carousel-control").click(function() {
        slideToNextActive(-1);
    });
    $(window).on('resize', function(){
        slideToNextActive(0);
    });
});

$(window).on("load", function() {
    slideToNextActive(0);
});