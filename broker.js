'use strict';

const cluster = require('cluster');

if(cluster.isMaster) {
  [0, 1, 2, 3].forEach(() => cluster.fork());
  cluster.on('message', (msg) => {
    //Object.keys(cluster.workers).forEach((wid) => cluster.workers[wid].send(msg));
    Object.keys(cluster.workers).forEach((wid) => { cluster.workers[cluster.workers[wid].process.pid] = cluster.workers[wid]; });
    cluster.workers[msg.pid].send(msg);
  });
} else {
  setInterval(() => {
    process.send({pid: process.pid, time: new Date().toISOString()});
  }, Math.random()*10000);

  process.on('message', (msg) => {
    console.log(msg.pid, new Date().valueOf() - Date.parse(msg.time).valueOf());
  });
}

