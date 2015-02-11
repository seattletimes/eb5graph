var util = require("./util");
var async = require("./async");
var tooltipHTML = require("./_tooltip.html");

//on startup
var plot = document.querySelector(".plot-area");

var app = window.i526;
app.mode = "absolute";
app.render = function() {
  if (app.animating) return;
  app.animating = true;
  var stack = [];
  for (var i = 0; i < app.applications[0].data.length; i++) { stack[i] = 0 }; //zero the baseline
  var plotBounds = plot.getBoundingClientRect();

  var chains = [];
  
  app.applications.forEach(function(row) {
    row.data.forEach(function(item, i) {
      var element = item.element;
      var height = app.mode == "absolute" ? item.absolute / app.max * 100 : item.relative;
      var base = stack[i];
      stack[i] += height;
      var chain = [function(c) {
        plot.className = plot.className.replace(/\s*animate\s*/g, "");
        util.removeTransform(element);
        element.style.height = height + .1 + "%";
        element.style.bottom = base + "%";
        c();
      }];
      var animation = [
        util.delay(10),
        function(c) {
          util.freeze(element);
          c();
        },
        util.delay(10),
        function(c) {
          plot.className += " animate";
          var pxHeight = height / 100 * plotBounds.height;
          var pxBase = base / 100 * plotBounds.height;
          var top = plotBounds.height - pxHeight - pxBase;
          util.transform(element, top, pxHeight);
          c();
        },
        util.delay(1000)
      ];
      //prepend the animation steps if we're ready for it
      if (app.animate) {
        chain = animation.concat(chain);
      }
      //queue this up to run
      chains.push(function(c) {
        async.series(chain, c);
      });
    });
  });

  //run all chains in parallel, but on completion unset the animation flag
  async.parallel(chains, function() {
    app.animating = false;
  });
}

app.applications.forEach(function(row, i, apps) {
  var country = row.country;
  var shade = Math.round(i * 240 / apps.length);
  row.color = "rgb(" + [shade, shade, shade].join() + ")";
  row.data.forEach(function(item, i, arr) {
    var el = document.createElement("div");
    el.className = "item";
    el.setAttribute("connect", country + "-" + i);
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

app.render();
app.animate = true;

document.body.addEventListener("click", function() {
  if (app.animating) return;
  app.mode = app.mode == "absolute" ? "relative" : "absolute";
  app.render();
});