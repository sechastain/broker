'use strict';

const cluster = require('cluster');
const sio = require('socket.io-client');
const request = require('request');

var total = 0;
var count = 0;

function log(msg) {
  var start = Date.parse(msg.start).valueOf();
  var rcvd = Date.parse(msg.rcvd).valueOf();
  var now = new Date().valueOf();
  total += (now - start);
  count++;
  if(count % 1000 === 0) console.log(msg.svc, msg.pid, 'to repeater', (rcvd - start), 'from repeater', (now-rcvd), 'full loop', (now - start), 'avg (' + count + ')', total/count);
}

function netRouter() {
  console.log('creating ws router');
  let sock = sio('http://localhost:3000');
  process.on('message', (msg) => {
    sock.emit('wsmessage', msg);
  });
  sock.on('message', function(msg) {
    process.send(msg);
  });
}

function wsMessenger() {
  console.log('creating ws child');
  //setInterval(() => {
  let next = () => {
    let msg = {svc: 'WSKT', pid: process.pid, type: 'req', start: new Date().toISOString()};
    process.send(msg);
  };

  process.on('message', (msg) => {
    log(msg);
    next();
  });

  next();
}

function restMessenger() {
  console.log('creating rest child');
  //setInterval(() => {
  let next = () => {
    let msg = {svc: 'REST', pid: process.pid, type: 'msg', start: new Date().toISOString()};
    request({
      url: 'http://localhost:3000/msg',
      json: msg,
      method: 'POST'
    },
    function(err, request, body) {
      log(body);
      next();
    });
  };
  next();
}

if(cluster.isMaster) {
  var netRouter;
  var count = 0;
  var start = new Date().valueOf();
  //[0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8].forEach((i) => {
  [0, 1, 2].forEach((i) => {
    var env = Object.assign({}, process.env);
    if(i === 0) env.NETROUTER=1;
    else if(i % 2 === 0) env.WSROUTE=1;

    var pid = cluster.fork(env).process.pid;

    if(i === 0) netRouter = pid;
  });
  cluster.on('message', (msg) => {
    let pid = msg.type === 'req' ? netRouter : msg.pid;
    //console.log('type', msg.type, 'orig', msg.pid, 'pid', pid);
    Object.keys(cluster.workers).forEach((wid) => { cluster.workers[cluster.workers[wid].process.pid] = cluster.workers[wid]; });
    cluster.workers[pid].send(msg);
  });
} else {
  if(process.env.NETROUTER) netRouter();
  else if(process.env.WSROUTE) wsMessenger();
  else restMessenger();
}

