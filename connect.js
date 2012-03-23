// Web variety
$(function() {
  var key = $("#robot-key").text();

  new Connect(key).start(function(msg) {
    alert("Could not connect: " + msg); 
  });
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
