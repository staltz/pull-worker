var pull = require('pull-stream');

module.exports = function toDuplex(workerApi) {
  var buffer = [];
  var cbs = [];
  var isReceiving = false;
  var isSending = false;

  function close() {
    setTimeout(function tryToClose() {
      if (!isReceiving && !isSending) {
        (workerApi.close || workerApi.terminate).call(workerApi);
      } else {
        setTimeout(tryToClose);
      }
    });
  }

  function consumeReads() {
    var cb, msg;
    while (buffer.length && cbs.length) {
      cb = cbs.shift();
      if (buffer.length) {
        msg = buffer.shift();
        switch (msg.type) {
          case 'data':
            cb(null, msg.data);
            break;

          case 'error':
            cb(msg.data);
            isReceiving = false;
            close();
            return;
            break;

          case 'end':
            cb(true);
            isReceiving = false;
            close();
            return;
            break;

          default:
            (console.warn | console.log)('pull-worker cannot recognize message', msg);
            break;
        }
      }
    }
  }

  function onMsg(event) {
    buffer.push(event.data);
    consumeReads();
  }

  if (workerApi.addEventListener) {
    workerApi.addEventListener('message', onMsg);
  } else {
    workerApi.onmessage = onMsg;
  }

  function read(abort, cb) {
    isReceiving = true;
    if (!cb) throw new Error('*must* provide cb');
    if (abort) {
      while (cbs.length) {
        cbs.shift()(abort);
      }
      cb(abort);
      isReceiving = false;
      close();
    } else {
      cbs.push(cb);
      consumeReads();
    }
  }

  function write(read) {
    isSending = true;
    read(null, function next(end, data) {
      if (end === true) {
        workerApi.postMessage({ type: 'end' });
        isSending = false;
        close();
      } else if (end) {
        workerApi.postMessage({ type: 'error', data: errOrEnd });
        isSending = false;
        close();
      } else {
        workerApi.postMessage({ type: 'data', data: data });
        read(null, next);
      }
    });
  }

  return {
    source: read,
    sink: write
  };
};
