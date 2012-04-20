function Connect(key) {
  var connection = this;

  connection.start = function(callback) {
    var protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://',
      host = protocol + window.location.host,
      viewport = new Viewport('control'),
      control = new Control(host);

    $(control.socket).on('open', function() {
      control.socket.send("auth|" + key);
    });

    $(control.socket).on('message', function(e) {
      var img = '<img src="/img/play.png" title="Record"/>',
        split = e.originalEvent.data.split('|');

      switch (split[0]) {
      case "auth":
        control.attach(viewport);

        $('.nav').append('<li><a class="record play" href="#">' + img + '</a></li>');

        $(viewport).on('reload', function() {
          control.drawPointer(viewport);
        });

        setTimeout(viewport.start, 1000);
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
        control.socket.close();
        callback(split.join(' '));
      }
    });

    return connection;
  };

  return connection;
}

function standardConnect(key) {
  return new Connect(key).start(function(msg) {
    alert("Could not connect: " + msg);
  });
}
