# pylon
A microservice gateway

## UDP Server Example

```js

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    const resJSON = JSON.parse(msg)
    console.log(resJSON)
});

server.on('listening', () => {
  var address = server.address();
  server.setBroadcast(true);
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(8989);
```

## UDP Client Example

```js
const dgram = require('dgram');
const message = JSON.stringify({"hello": "world"});
const client = dgram.createSocket('udp4');
client.bind(8989, () => {
  clinet.setBroadcast(true);
  client.send(message, 0, message.length, 8989, '255.255.255.255', (err) => {
    client.close();
  });
});
