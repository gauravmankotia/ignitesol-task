var mysql = require('mysql');

var connection = null;

const connect = () => {
    if (!connection) {
        console.log('connecting to mysqldb');
        connection = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PWD,
            connectTimeout:5000,
            database:process.env.MYSQL_DB
        });
        connection.connect(function (err) {
            if (err) {
                console.error('error connecting mysqldb: ' + err.stack);
                process.exit(0);
                return;
            }
            console.log('mysqldb connected as id ' + connection.threadId);
        });
    }
    return connection;
}
exports.connect = connect;