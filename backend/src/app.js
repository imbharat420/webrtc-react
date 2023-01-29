const express = require('express')
const { config } = require('dotenv')
// const { rateLimit } = require('express-rate-limit')
// const morgan = require('morgan')
// const cors = require('cors')
// const { handleError } = require('req-error')

const app = express();
app.use(express.static('public'));
config({ path: '.env' });
const PORT = process.env.PORT || 8000;

//middlewares
// const httpResponder = require('./middleware/httpResponder.js')
// const { getBody } = require('./middleware/reqUtils.js')


// app.set('env', process.env.NODE_ENV);
// app.use(
//   cors({
//     credentials: true,
//     origin: true,
//   })
// );

// import fs from 'fs';
// import path, { dirname } from 'path';
// import { fileURLToPath } from 'url';

// // ----  set and Add Middleware -- //
// const __dirname = dirname(fileURLToPath(import.meta.url));
// const p = path.join(__dirname, '..', '/public');
// console.log(p);
// app.use(express.static(p));
// app.use(httpResponder);
// app.request.getBody = getBody;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

// const globalLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 1000,
//   message: { error: 'Too many requests!, please try again after 25mins' },
// });
// app.use('/api/', globalLimiter);

// app.use(morgan('dev'));

// // ---- ROUTES ----- //
// app.use('/api/auth', authRoute);
// app.use('/api/edit', editRoute);

// app.use('*', (req, res) => {
//   res.send('Page Not Found');
// });



module.exports = app;