var util = require("./util");
var tooltipHTML = require("./_tooltip.html");

var app = window.i526;
app.mode = "absolute";
var animationLength = 1000;

var plot = document.querySelector(".plot-area");
var topLabel = document.querySelector(".plot .y-axis .top");
var bottomLabel = document.querySelector(".plot .y-axis .bottom");
var title = document.querySelector(".plot .title");

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

//DOM setup
app.applications.forEach(function(row, i, apps) {
  var country = row.country;
  row.color = "hsl(" + (i * 15 + 180) + ", 40%, 40%)";
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
    tooltip.innerHTML = tooltipHTML
      .replace("{{country}}", country)
      .replace("{{year}}", i + 1992)
      .replace("{{absolute}}", item.absolute)
      .replace("{{relative}}", item.relative.toFixed(1));
    el.appendChild(tooltip);
    
    item.element = el;
    plot.appendChild(el);
  });
});
//label x-axis
var xAxis = document.querySelector(".plot .x-axis");
var len = app.applications[0].data.length;
for (var i = 0; i < len; i++) {
  var label = document.createElement("label");
  label.className = "year";
  label.innerHTML = i + 1992;
  label.style.left = i * (100 / len) + "%";
  xAxis.appendChild(label);
}

app.render();
app.animate = true;

document.body.addEventListener("touchend", function() {
  if (app.animating) return;
  app.mode = app.mode == "absolute" ? "relative" : "absolute";
  app.render();
});

document.body.addEventListener("click", function() {
  if (app.animating) return;
  app.mode = app.mode == "absolute" ? "relative" : "absolute";
  app.render();
});