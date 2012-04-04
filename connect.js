function Connect(key) {
  var connection = this;

  connection.start = function(callback) {
    var protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://',
      host = protocol + window.location.host,
      viewport = new Viewport('control'),
      control = new Control(host);

    control.socket.onopen = function() {
      control.socket.send("auth|" + key);
    };

    control.socket.onmessage = function(e) {
      if (e.data === 'connect') {
        control.attach(viewport);

        var img = '<img src="/img/play.png" title="Record"/>';

        $('.nav').append('<li><a class="record" href="#">' + img + '</a></li>');

        $(viewport).on('reload', function() {
          control.drawPointer(viewport);
        });

        setTimeout(viewport.start, 1000);
      } else {
        control.socket.close();
        callback(e.data);
      }
    };
  };

  return connection;
}

function standardConnect(key) {
  return new Connect(key).start(function(msg) {
    alert("Could not connect: " + msg);
  });
}
