var pull = require('pull-stream');
var test = require('tape');
var Worker = require('tiny-worker');
var toDuplex = require('./index');

test('works as a sink in the worker, as a source in the client', function(t) {
  var worker = new Worker(function() {
    var pull = require('pull-stream');
    var toDuplex = require(__dirname + '/index');
    var serverStream = toDuplex(self);
    pull(pull.values([10, 20, 30, 40]), serverStream);
  });

  var clientStream = toDuplex(worker);
  pull(
    clientStream,
    pull.collect(function(err, arr) {
      t.error(err, 'no error happened');
      t.deepEqual(arr, [10, 20, 30, 40], 'data is [10,20,30,40]');
      t.end();
    })
  );
});

test('works as a source in the worker, as a sink in the client', function(t) {
  var worker = new Worker(function() {
    var pull = require('pull-stream');
    var toDuplex = require(__dirname + '/index');
    var serverStream = toDuplex(self);
    pull(serverStream, pull.map(x => x * 0.1), serverStream);
  });

  var clientStream = toDuplex(worker);
  pull(
    pull.values([10, 20, 30, 40]),
    clientStream,
    pull.collect(function(err, arr) {
      t.error(err, 'no error happened');
      t.deepEqual(arr, [1, 2, 3, 4], 'data is [1,2,3,4]');
      t.end();
    })
  );
});
