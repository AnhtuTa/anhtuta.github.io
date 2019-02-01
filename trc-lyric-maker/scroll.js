function getRelativePos(elm) {
    var pPos = elm.parentNode.getBoundingClientRect(), // parent pos
        cPos = elm.getBoundingClientRect(), // target pos
        pos = {};

    pos.top = cPos.top - pPos.top + elm.parentNode.scrollTop,
        pos.right = cPos.right - pPos.right,
        pos.bottom = cPos.bottom - pPos.bottom,
        pos.left = cPos.left - pPos.left;

    return pos;
}

// From: https://gist.github.com/gre/1650294
function easeInOutCubic(t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 }
function easeInOutQuad(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t };

/**
 * Scroll to an element inside a container
 * Chú ý: element = thẻ div. Nếu element mà là thẻ span thì nó sẽ scroll lên top của container
 * @param {HTMLElement} container The wrapper element to do scrolling
 * @param {HTMLElement} element Element inside container. Scroll to its position
 * @param {Number} duration Time to scroll, in milisecond
 **/
function scrollInsideElement(container, element, duration) {
    var pos = getRelativePos(element);
    var start = container.scrollTop,
        change = pos.top - start,
        startTime = performance.now(),
        now, elapsed, t;

    function animateScroll() {
        now = performance.now();
        elapsed = now - startTime;
        t = elapsed / duration;

        container.scrollTop = start + change * easeInOutQuad(t);

        if (t < 1)
            window.requestAnimationFrame(animateScroll);
    };

    animateScroll();
}

/**
 * Scroll to an element inside a container, but element will be
 * in the center of container
 */
var myReqFrame;
function scrollInsideElementToCenter(container, element, duration) {
    var pos = getRelativePos(element);
    var start = container.scrollTop,
        change = pos.top - start,
        startTime = performance.now(),
        now, elapsed, t;

    function animateScroll() {
        now = performance.now();
        elapsed = now - startTime;
        t = elapsed / duration;

        container.scrollTop = start + change * easeInOutQuad(t) - 100;

        if (t < 1) window.requestAnimationFrame(animateScroll);
    };

    animateScroll();
}


/**
 * Scroll the page to an element's position (element nên là thẻ div, ko phải span)
 * @param {HTMLElement} element the tag we wants browser to scroll to
 * @param {Number} duration scrolling time in milisecond
 */
function scrollPage(element, duration) {
    var startingY = window.pageYOffset;
    var elementY = window.pageYOffset + element.getBoundingClientRect().top;

    // If element is close to page's bottom then window will scroll only to some position above the element.
    var targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elementY;
    var diff = targetY - startingY;
    var start;

    if (!diff) return;

    // Bootstrap our animation - it will get called right before next frame shall be rendered.
    window.requestAnimationFrame(function step(timestamp) {
        if (!start) start = timestamp;
        // Elapsed miliseconds since start of scrolling.
        var time = timestamp - start;

        // Get percent of completion in range [0, 1].
        var percent = Math.min(time / duration, 1);

        // Apply the easing.
        // It can cause bad-looking slow frames in browser performance tool, so be careful.
        percent = easeInOutCubic(percent);

        window.scrollTo(0, startingY + diff * percent);

        // Proceed with animation as long as we wanted it to.
        if (time < duration) {
            window.requestAnimationFrame(step)
        }
    })
}
