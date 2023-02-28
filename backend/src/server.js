const http = require('http');
const app = require('./app.js');

const server = http.createServer(app);
server.listen(8000, () => {
   const [connectedPort] = server._connectionKey.match(/\d+$/);
   console.log(`App running on port "${connectedPort}"`);
});

module.exports = server;
