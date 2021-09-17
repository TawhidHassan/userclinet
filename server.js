/* eslint-disable no-console */
const mongoose = require('mongoose');

// process.on('uncaughtException', err => {
//   console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//   console.log(err.name, err.message);
//   process.exit(1);
// });

const app = require('./app');

const DB =
  'mongodb+srv://sifatweb:Sifat15963740@cluster0.nnk69.mongodb.net/myFirstDatabase?authSource=admin&replicaSet=atlas-p80ak0-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true';

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    autoIndex: true
  })
  .then(() => console.log('DB connection successful!'));

const port = 5000 || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // server.close(() => {
  //   process.exit(1);
  // });
});
