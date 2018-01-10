# pull-worker

_Convert a Web Worker API to a duplex pull-stream_

```
npm install --save pull-worker
```

This module also supports Workers in Node.js such as those from `tiny-worker`.

## Usage

**main.js**

```js
var pull = require('pull');
var toDuplex = require('pull-worker');

var worker = new Worker('worker.js');
var stream = toDuplex(worker);

pull(
  pull.values([20, 40, 60, 80]),
  stream,
  pull.drain(x => {
    console.log(x); // 2
                    // 4
                    // 6
                    // 8
  })
);
```

**worker.js**

```js
var pull = require('pull');
var toDuplex = require('pull-worker');

var stream = toDuplex(self);

pull(
  stream,
  pull.map(x => x * 0.1),
  stream
);
```

(Note: you might need to "browserify" or "workerify" the worker.js before running it in the browser)
