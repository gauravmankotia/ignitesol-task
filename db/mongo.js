'use strict';
const mongoose = require('mongoose');
var conn = null;

exports.connect = async function() {
  if (conn == null) {
    mongoose.set('strictQuery', true);
    conn = mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
      useNewUrlParser: true,
			useUnifiedTopology: true
    }).then(() => mongoose);
    
    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn;
    console.log('mongodb connected');
  }
  return conn;
};