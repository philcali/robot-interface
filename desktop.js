var Desktop = (function() {
  function DesktopImage(elem, obj) {
    if (typeof obj === 'undefined') {
      obj = {};
    }

    // Public members 
    this.interval = typeof obj.interval === 'undefined' ? 200 : obj.interval;
    this.scaleX = (typeof obj.scaleX === "undefined") ? "1.0" : parseFloat(obj.scaleX);
    this.scaleY = typeof obj.scaleY === 'undefined' ? "1.0" : parseFloat(obj.scaleY);
    this.quality = typeof obj.quality === 'undefined' ? "0.2" : parseFloat(obj.quality);
    this.pointer = typeof obj.pointer === 'undefined' ? false : obj.pointer;

    var desktop = this,
      running = false,
      image = document.getElementById(elem),
      reloading = $(image).attr('data-reload');

    image.onload = function() {
      $(desktop).trigger('reload', [image]);

      // Redraw desktoptop only after the last draw
      if (desktop.isRunning()) {
        setTimeout(desktop.execute, desktop.interval);
      }
    };

    this.buildUrl = function() {
      var p = desktop.pointer ? 'p' : 'n';
      return "/image/desktop_" +
        desktop.scaleX + "x" +
        desktop.scaleY + "_" +
        desktop.quality + "_" + p + ".jpg";
    };

    this.execute = function() {
      image.src = desktop.buildUrl();
    };

    this.isRunning = function() { return running; };

    this.start = function() {
      running = true;
      desktop.execute();
    };

    this.stop = function() {
      running = false;
    };

    this.currentImage = function() { return image; };
  }

  var instance;

  return {
    get: function(elem, props) {
      if (typeof instance === 'undefined') {
        instance = new DesktopImage(elem, props);
      }
      return instance;
    },

    isDefined: function() { return (typeof instance !== 'undefined'); }
  };
}());
