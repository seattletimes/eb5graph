var trans = 
  "msTransform" in document.body.style ? "msTransform" :
  "webkitTransform" in document.body.style ? "webkitTransform" :
  "transform";

module.exports = {
  freeze: function(element) {
    var bounds = element.getBoundingClientRect();
    var parent = element.parentElement.getBoundingClientRect();
    element.style.height = "1px";
    element.style.bottom = "auto";
    this.transform(element, bounds.top - parent.top, bounds.height);
  },
  transform: function(element, top, height) {
    element.style[trans] = "translateY(" + top + "px) scaleY(" + height + ")"
  },
  removeTransform: function(element) {
    element.style[trans] = "";
  },
  skip: function(c) {
    c();
  },
  delay: function(interval) {
    return function() {
      var callback = arguments[arguments.length - 1];
      setTimeout(function() {
        callback();
      }, interval || 400);
    }
  }
};