const dotenv= require('dotenv')

dotenv.config();
if (process.argv.at(-1) === '--NODE_ENV=development') {
  console.clear();
  process.env.NODE_ENV = 'development';
} else process.env.NODE_ENV ||= 'production';

process.env.PORT ||= 8000;

const io = require('./src/socket.js')
const server = require('./src/server.js')
io.attach(server);


