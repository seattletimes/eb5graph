var noop = function() {};

module.exports = {
  series: function(tasks, callback) {
    callback = callback || noop;
    var index = -1;
    var next = function() {
      index++;
      var f = tasks[index];
      if (!f) return callback();
      f(next);
    }
    next();
  },
  parallel: function(tasks, callback) {
    callback = callback || noop;
    var completed = 0;
    var check = function() {
      completed++;
      if (completed == tasks.length) {
        return callback();
      }
    }
    for (var i = 0; i < tasks.length; i++) {
      tasks[i](check);
    }
  }
}