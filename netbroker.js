'use strict';

const cluster = require('cluster');
const net = require('net');

function netRouter() {
  console.log('creating net router');
  var sock = new net.Socket().connect(2000, 'localhost');
  process.on('message', (msg) => {
    sock.write(JSON.stringify(msg) + '\n');
  });
  sock.on('data', function(chunk) {
    chunk.toString().split('\n').forEach(json => {
      if(json.trim().length === 0) return;
      process.send(JSON.parse(json));
    });
  });
}

function childMessenger() {
  console.log('creating child');
  setInterval(() => {
    process.send({pid: process.pid, type: 'req', start: new Date().toISOString()});
  }, 0);

  process.on('message', (msg) => {
    var start = Date.parse(msg.start).valueOf();
    var rcvd = Date.parse(msg.rcvd).valueOf();
    var now = new Date().valueOf();
    //console.log(msg.pid, 'to repeater', (rcvd - start), 'from repeater', (now-rcvd), 'full loop', (now - start));
  });
}

if(cluster.isMaster) {
  var netRouter;
  var count = 0;
  var start = new Date().valueOf();
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8].forEach((i) => {
    var env = Object.assign({}, process.env);
    if(i === 0) env.NETROUTER=1;
    var pid = cluster.fork(env).process.pid;
    if(i === 0) netRouter = pid;
  });
  cluster.on('message', (msg) => {
    //Object.keys(cluster.workers).forEach((wid) => cluster.workers[wid].send(msg));
    let pid = msg.type === 'req' ? netRouter : msg.pid;
    //console.log('type', msg.type, 'orig', msg.pid, 'pid', pid);
    Object.keys(cluster.workers).forEach((wid) => { cluster.workers[cluster.workers[wid].process.pid] = cluster.workers[wid]; });
    cluster.workers[pid].send(msg);
    count++;
    if(count % 1000 === 0) {
        console.log(count, new Date().valueOf() - start);
    }
  });
} else {
  if(process.env.NETROUTER) netRouter();
  else childMessenger();
}

