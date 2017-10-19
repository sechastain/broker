'use strict';

const net = require('net');

let server = new net.Server();

server.listen(2000, 'localhost');
server.on('connection', (sock) => {
  sock.on('data', (chunk) => {
    chunk.toString().split('\n').forEach(json => {
      if(json.trim().length === 0) return;
      json = JSON.parse(json);
      json.rcvd = new Date().toISOString();
      json.type = 'rsp';
      sock.write(JSON.stringify(json) + '\n');
    });
  });
});

