'use strict';

const rp = require('restify-plugins');
const restify = require('restify');
const sio = require('socket.io');

let server = restify.createServer();
let io = sio.listen(server.server);

function processBody(body) {
  var ret = Object.assign({}, body);
  ret.rcvd = new Date().toISOString();
  return ret;
}

server.get('/alive', (req, res, next) => res.send(200, 'yes'));
server.post('/msg',
  rp.bodyParser(),
  (req, res, next) => {
    let body = processBody(req.body);
    res.send(200, body);
    return undefined;
  });

io.sockets.on('connection', (sock) => {
  sock.on('wsmessage', (data) => {
    let body = processBody(data);
    body.type = 'rsp';
    sock.emit('message', body);
  });
});

server.listen(3000);

