// Web variety
$(function() {
  var key = $("#robot-key").text();

  standardConnect(key);
});

function Connect(key) {
  var self = this;

  self.start = function(callback) {
    var protocol = window.location.protocol == 'https:' ? 'wss://' : 'ws://';
    var host = protocol + window.location.host;

    var viewport = new Viewport('control');
    var control = new Control(host);

    control.socket.onopen = function() {
      control.socket.send("auth|" + key);
    };

    control.socket.onmessage = function(e) {
      if (e.data == 'connect') {
        control.attach(viewport);

        var img = '<img src="/img/play.png" title="Record"/>';

        $('.nav').append('<li><a class="record" href="#">'+img+'</a></li>');

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

  return self;
}

function standardConnect(key) {
  return new Connect(key).start(function(msg) {
    alert("Could not connect: " + msg);
  });
}
