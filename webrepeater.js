'use strict';

const rp = require('restify-plugins');
const restify = require('restify');
const sio = require('socket.io');

let server = restify.createServer();
let io = sio.listen(server.server);

server.get('/alive', (req, res, next) => res.send(200, 'yes'));
server.post('/msg',
  rp.bodyParser(),
  (req, res, next) => {
    let body = req.body;
    body.rcvd = new Date().toISOString();
    res.send(200, body);
    return undefined;
  });

io.sockets.on('connection', (sock) => {
  sock.on('wsmessage', (data) => {
    data.rcvd = new Date().toISOString();
    data.type = 'rsp';
    sock.emit('message', data);
  });
});

server.listen(3000);

