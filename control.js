// Light wrapper over socket api, and convenience for attaching to a Viewport
function Control(url) {
  var control = this,
    scaledX = 1.0,
    scaledY = 1.0,
    authed = false,
    attached = false;

  control.socket = new WebSocket(url);
  control.mousepos = { x: 0, y: 0 };

  control.isAuthed = function() { return authed; };
  control.isAttached = function() { return attached; };

  control.auth = function(key) {
    $(control.socket).on('open', function() {
      control.socket.send("auth|" + key);
    });

    $(control.socket).on('message', function(e) {
      var split = e.originalEvent.data.split('|');

      switch (split[0]) {
      case "auth":
        authed = true;
        $(control.socket).off('message');
        $(control).trigger('loginsuccess');
        break;
      default:
        control.socket.close();
        $(control).trigger('loginfailure', { msg: split.join(' ') });
      }
    });
  };

  control.addCommunication = function() {
    $(control.socket).on('message', function(e) {
      var split = e.originalEvent.data.split('|');

      switch (split[0]) {
      case "clipboard":
        switch (split[1]) {
        case "get":
          $("#clipboard-contents").val(split.slice(2).join('|'));
          $("#clipboard-modal").modal('show');
          $("#clipboard-contents").focus();
          break;
        default:
          console.log(split[1]);
        }
        break;
      case "record":
        switch (split[1]) {
        case "started":
          $(".record").removeClass('wait').addClass('stop');
          $(".record").children("img").attr("src", "/img/stop.png");
          break;
        case "stopped":
          $(".record").removeClass('wait').addClass('play');
          $(".record").children("img").attr("src", "/img/play.png");
          break;
        default:
          control.socket.send("record|status");
        }
        break;
      default:
        console.log(e.originalEvent.data);
      }
    });
  };

  control.addRecord = function() {
    var img = '<img src="/img/play.png" title="Record"/>';
    $('.nav').append('<li><a class="record play" href="#">' + img + '</a></li>');

    $(".record").on('click', function() {
      if ($(this).hasClass('play')) {
        $(this).removeClass('play');
        control.socket.send("record|record");
      } else if ($(this).hasClass('stop')) {
        $(this).removeClass('stop');
        control.socket.send("record|stop");
      }
      return false;
    });
  };

  control.addClipboard = function() {
    var img = '<img src="/img/clip.png" title="Clipboard"/>';
    $('.nav').append('<li><a class="clipboard" href="#">' + img + '</a></li>');

    $('.clipboard').on('click', function() {
      control.socket.send('clipretrieve|get');
      return false;
    });

    $('#clipboard-send').on('click', function() {
      control.socket.send('clipset|' + $('#clipboard-contents').val());
      $('#clipboard-modal').modal('hide');
      return false;
    });
  };

  control.addDisplayControls = function(viewport) {
    var gatherValues = function() {
      var scale = $('.size').val();
      return {
        quality: $('.quality').val(),
        pointer: $('.pointer').is(':checked'),
        scaleX: scale,
        scaleY: scale
      };
    },
      img = '<img src="/img/display.png" title="Display Settings"/>',
      callback = (function() {
        if (!Desktop.isDefined()) {
          return function() {
            var vs = gatherValues(),
              props = [vs.scaleX, vs.scaleY, vs.quality, vs.pointer].join('|');
            control.socket.send('image|' + props);
            return vs;
          };
        } else {
          return function() {
            var vs = gatherValues(),
              desktop = Desktop.get();

            desktop.scaleX = vs.scaleX;
            desktop.scaleY = vs.scaleY;
            desktop.pointer = vs.pointer;
            desktop.quality = vs.quality;
            return vs;
          };
        }
      }());

    $('.nav').append('<li><a class="display" href="#">' + img + '</a></li>');

    $('.display').on('click', function() {
      $('#controls-modal').modal('show');
      return false;
    });

    $('#controls-send').off().on('click', function() {
      var vs = callback(),
        canvas = viewport.getCanvas();

      canvas.width = viewport.getWidth() * vs.scaleX;
      canvas.height = viewport.getHeight() * vs.scaleY;

      scaledX = 1 / vs.scaleX;
      scaledY = 1 / vs.scaleY;

      $('#controls-modal').modal('hide');
      return false;
    });
  };

  control.addKeyboard = function() {
    // Allow interaction with clipboard element
    $(document).on('keydown', function(evt) {
      if ($(evt.target).attr('id') !== 'clipboard-contents') {
        if (evt.preventDefault) {
          evt.preventDefault();
        }
        control.socket.send("keydown|" + evt.keyCode);
      }
    });

    $(document).on('keyup', function(evt) {
      if ($(evt.target).attr('id') !== 'clipboard-contents') {
        if (evt.preventDefault) {
          evt.preventDefault();
        }
        control.socket.send("keyup|" + evt.keyCode);
      }
    });
  };

  control.attach = function(viewport) {
    // Must be authed and not yet attached
    if (!control.isAuthed() || control.isAttached()) {
      return control;
    }

    // Additional capabilities
    control.addCommunication();
    control.addDisplayControls(viewport);
    control.addRecord();
    control.addClipboard();
    control.addKeyboard();

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
        control.socket.send("mousemove|" +
          Math.round(x * scaledX) + "|" + Math.round(y * scaledY)
          );
      });

      $(canvas).on('mousedown', function(evt) {
        control.socket.send("mousedown|" + evt.button);
      });

      $(canvas).on('mouseup', function(evt) {
        control.socket.send("mouseup|" + evt.button);
      });

      $(canvas).on("contextmenu", function(e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
      });
    });

    $(viewport).on('reload', function() {
      control.drawPointer(viewport);
    });

    attached = true;
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
