var util = require("./util");

var app = window.i526;
app.mode = "absolute";
var animationLength = 1000;

var plot = document.querySelector(".plot-area");
var topLabel = document.querySelector(".plot .y-axis .top");
var bottomLabel = document.querySelector(".plot .y-axis .bottom");
var title = document.querySelector(".plot .title");

var isMobile = function() { return window.matchMedia && window.matchMedia("(max-width: 480px)").matches };

app.render = function() {
  if (app.animating) return;
  app.animating = true;
  var isAbsolute = app.mode == "absolute";
  // console.time("render");
  // console.timeStamp("render start");
  
  var stack = [];
  for (var i = 0; i < app.applications[0].data.length; i++) { stack[i] = 0 }; //zero the baseline
  var plotBounds = plot.getBoundingClientRect();

  //layout stages
  var freeze = [];
  var addClass = function() { plot.className += " animate" };
  var animate = [];
  var finish = [];

  topLabel.innerHTML = isAbsolute ? app.max.toLocaleString() : "100%";
  bottomLabel.innerHTML = isAbsolute ? "0" : "0%";
  title.innerHTML = isAbsolute ? "I526 Applications" : "Relative proportion of applications by country"
  
  app.applications.forEach(function(row) {
    row.data.forEach(function(item, i) {
      var element = item.element;
      var height = isAbsolute ? item.absolute / app.max * 100 : item.relative;
      var base = stack[i];
      stack[i] += height;
      var bounds = element.getBoundingClientRect();
      
      var pxHeight = height / 100 * plotBounds.height;
      var pxBase = base / 100 * plotBounds.height;
      var bottom = plotBounds.height - pxBase;
      var duration = (row.data.length - i) * (animationLength / row.data.length) / 1000;
        
      freeze.push(function() {
        util.freeze(bounds, plotBounds, element);
      });
      
      animate.push(function() {
        util.transform(element, bottom, pxHeight);
        util.transitionDuration(element, duration);
      });
      
      finish.push(function() {
        plot.className = plot.className.replace(/\s*animate\s*/g, "");
        util.removeTransform(element);
        util.transitionDuration(element, 0);
        element.style.height = height + .1 + "%";
        element.style.bottom = base + "%";
      });
      
    });
  });

  if (app.animate) {
    util.syncLayout([freeze, addClass, animate]);
    setTimeout(function() {
      util.syncLayout([finish]);
      app.animating = false;
      // console.timeEnd("render");
      // console.timeStamp("render finished");
    }, animationLength);
  } else {
    util.syncLayout([finish]);
    app.animating = false;
  }
}

app.switch = function() {
  if (app.animating) return;
  app.mode = app.mode == "absolute" ? "relative" : "absolute";
  app.render();
};

// console.time("DOM");
//DOM setup
var len = app.applications[0].data.length;
var xAxis = document.querySelector(".plot .x-axis");
var yearly = []; //resorted by year for tooltips

for (var i = 0; i < app.applications[0].data.length; i++) {
  var countries = {};
  for (var c = 0; c < app.applications.length; c++) {
    var country = app.applications[c]; //get each country
    var data = country.data[i]; //grab the specific year for that country
    countries[country.country] = data;
  }
  yearly[i] = countries; //add that year to the collection
}

for (var i = 0; i < len; i++) {
  //create a label for the year
  var label = document.createElement("label");
  label.className = "year";
  label.innerHTML = i + 1992;
  label.style.left = i * (100 / len) + "%";
  xAxis.appendChild(label);
}
//add graph elements
app.applications.forEach(function(row, i, apps) {
  var country = row.country;
  row.color = "hsl(" + (i * 48 + 180) + ", 30%, " + (i > (len / 2) ? "30%" : "50%") + ")";
  row.data.forEach(function(item, i, arr) {
    var el = document.createElement("div");
    el.className = "item " + country;
    el.setAttribute("connect", country + "-" + i);
    el.setAttribute("data-index", i);
    el.style.width = 100 / arr.length + "%";
    el.style.left = i * (100 / arr.length) + "%";
    el.style.backgroundColor = row.color;

    var tooltip = document.createElement("div");
    tooltip.className = "tooltip";

    var tooltipHTML = "<h1>" + (i + 1992) + "</h1><ul>";
    var year = yearly[i];
    for (var c in year) {
      var data = year[c];
      tooltipHTML += country == c ? "<li class=match>" : "<li>";
      tooltipHTML += "<b>" + c + "</b>: " + data.absolute.toLocaleString() + " (" + data.relative.toFixed(1) + "%)";
    }
    tooltipHTML += "</ul>";

    tooltip.innerHTML = tooltipHTML;
    el.appendChild(tooltip);
    
    item.element = el;
    plot.appendChild(el);
  });
});

app.render();
app.animate = true;
// console.timeEnd("DOM");

var switchButton = document.querySelector(".switch");
switchButton.addEventListener("click", app.switch);

var focusedItem = null;

//mobile touch handling - poor man's fastclick
// var lastTouch = null;
// plot.addEventListener("touchstart", function(e) {
//   if (e.target.className.indexOf("item") > -1) {
//     lastTouch = {
//       timestamp: Date.now(),
//       event: e
//     };
//   }
// });
// plot.addEventListener("touchend", function(e) {
//   if (!lastTouch) return;
//   //check for old/invalid events
//   var now = Date.now();
//   if (
//     now - lastTouch.timestamp > 150  || 
//     e.target != lastTouch.event.target ||
//     e.touches[0].clientX - lastTouch.event.touches[0].clientX > 40 ||
//     e.touches[0].clientY - lastTouch.event.touches[0].clientY > 40
//   ) {
//     return lastTouch = null;
//   }
//   var click = document.createEvent("MouseEvent");
//   click.initEvent("click", true, true);
//   e.target.dispatchEvent(click);
//   //kill slow clicks on mobile
//   e.preventDefault();
//   return false;
// });

var modal = document.querySelector(".mobile-modal");
plot.addEventListener("click", function(e) {
  if (!isMobile()) return;
  //on mobile, get the popup out of the bar
  var tooltip = e.target.querySelector(".tooltip");
  if (!tooltip) return;
  focused = e.target;
  //place it in the floating popup, and show that
  modal.querySelector(".content").innerHTML = tooltip.innerHTML;
  modal.classList.add("show"); //we can use classlist, it's mobile-only.
});

modal.querySelector(".close").addEventListener("click", function() {
  modal.classList.remove("show");
  focused = null;
});

[].slice.call(modal.querySelectorAll(".shift")).forEach(function(shift) {
    shift.addEventListener("click", function(e) {
    if (!focused) return;
    var prop = e.target.getAttribute("data-shift");
    var next = focused[prop];
    if (!next.classList.contains("item")) return;
    focused = next;
    next.click();
  });
});