// Light wrapper over socket api, and convenience for attaching to a Viewport
function Control(url) {
  var control = this;

  control.socket = new WebSocket(url);
  control.mousepos = { x: 0, y: 0 };

  control.attach = function(viewport) {
    // Only state change
    viewport.withContext(function(context) {
      context.strokeStyle = "black";
      context.lineWidth = 2;
    });

    viewport.withCanvas(function(canvas) {
      // http://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
      $(canvas).on('mousemove', function(evt) {
        var obj = canvas,
          top = 0,
          left = 0,
          x = evt.clientX,
          y = evt.clientY;

        while (obj && obj.tagName !== 'BODY') {
          top += obj.offsetTop;
          left += obj.offsetLeft;
          obj = obj.offsetParent;
        }

        // return relative mouse position
        x = x - left + window.pageXOffset;
        y = y - top + window.pageYOffset;

        control.mousepos = { x: x, y: y };
        control.socket.send("mousemove|" + x + "|" + y);
      });

      $(canvas).on('mousedown', function(evt) {
        control.socket.send("mousedown|" + evt.button);
      });

      $(canvas).on('mouseup', function(evt) {
        control.socket.send("mouseup|" + evt.button);
      });
    });

    $(document).on('keydown', function(evt) {
      if (evt.preventDefault) {
        evt.preventDefault();
      }
      control.socket.send("keydown|" + evt.keyCode);
    });

    $(document).on('keyup', function(evt) {
      if (evt.preventDefault) {
        evt.preventDefault();
      }
      control.socket.send("keyup|" + evt.keyCode);
    });

    $(".record").live('click', function() {
      if ($(this).hasClass('play')) {
        $(this).removeClass('play');
        $(this).addClass('stop');
        $(this).children("img").attr("src", "/img/stop.png");
        control.socket.send("record|record");
      } else {
        $(this).removeClass('stop');
        $(this).addClass('play');
        $(this).children("img").attr("src", "/img/play.png");
        control.socket.send("record|stop");
      }
      return false;
    });

    $(document).on("contextmenu", function(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
    });

    return control;
  };

  control.drawPointer = function(viewport) {
    viewport.withCanvasAndContext(function(canvas, context) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.arc(control.mousepos.x, control.mousepos.y, 3, 2 * Math.PI, false);
      context.stroke();
    });
  };

  return control;
}
