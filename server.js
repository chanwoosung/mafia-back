const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const mongoose = require('mongoose');
const route = require('./src/route');

mongoose.connect('mongodb://localhost:27017/testDB')

const db = mongoose.connection;

db.on('error', err => console.error(err));
db.once('open', () => console.log('connected!'))

const socketIo = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONT_URL,
    credentials: true,
  },
});
const colors = require("colors/safe");

const socket = require("./src/socket");

const port = process.env.PORT;
app.use(cors({ origin: process.env.FRONT_URL, credentials: true }));
app.use('/',route);


server.listen(port, () => {
  console.log(
    `##### server is running on ${colors.brightGreen(
      process.env.BACK_URL
    )}. ${colors.yellow(new Date().toLocaleString())} #####`
  );
});

socket(socketIo)