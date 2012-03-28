// shim layer with setTimeout fallback
// TODO: remove this, replace as chrome extension
window.requestAnimFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
}());

function Viewport(canvasId) {
  var canvas = document.getElementById(canvasId),
    context = canvas.getContext('2d'),
    running = false,
    viewport = this;

  this.getCanvas = function() { return canvas; };
  this.getContext = function() { return context; };

  this.withCanvas = function(callback) { callback(canvas); };
  this.withContext = function(callback) { callback(context); };

  this.withCanvasAndContext = function(callback) {
    callback(canvas, context);
  };

  this.isRunning = function() { return running; };

  this.start = function() {
    running = true;
    viewport.animate();
  };

  this.stop = function() {
    running = false;
  };

  this.animate = function() {
    if (viewport.isRunning()) {
      $(viewport).trigger('reload');
      window.requestAnimFrame(viewport.animate);
    }
  };
}
