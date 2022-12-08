require('dotenv').config();
const mongoose = require('mongoose');
var books = null;
const fs = require('fs');
console.log('connecting to db');
var books_data = [];
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(db => {
    console.log(Date.now() + "\tConnected to database server.");
    books = require('./db/schema');
    fs.readdirSync('./data').forEach(file => {
        console.log(file);
        let tmp = require(`./data/${file}`);
        books_data = [...books_data, ...tmp]
    });

console.log('total books:', books_data.length);
return books.insertMany(books_data);
})
.then(data => {
    console.log('data inserted:', data);
    mongoose.connection.close();
})
.catch(err => {
    console.error(Date.now() + '\t Unable to connect to database server.\nProcess exited.\n', err);
}).finally(() => {
    process.exit(0);
});