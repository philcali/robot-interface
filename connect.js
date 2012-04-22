function Connect(key) {
  var connection = this,
    protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://',
    host = protocol + window.location.host,
    viewport = new Viewport('control'),
    control = new Control(host);

  connection.viewport = function() { return viewport; };

  connection.control = function() { return control; };

  connection.start = function(callback) {
    $(control).on('loginsuccess', function() {
      control.attach(viewport);

      setTimeout(viewport.start, 1000);
    });

    $(control).on('loginfailure', function(data) {
      callback(data.msg);
    });

    control.auth(key);

    return connection;
  };

  return connection;
}

function standardConnect(key) {
  return new Connect(key).start(function(msg) {
    alert("Could not connect: " + msg);
  });
}
