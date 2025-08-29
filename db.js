// *** YAHAN TABDEELI KI GAYI HAI: 'mysql2/promise' istemal kiya gaya hai ***
const mysql = require('mysql2/promise');

// *** YAHAN TABDEELI KI GAYI HAI: createConnection ki jagah createPool istemal kiya gaya hai ***
// createPool behtar performance deta hai
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'smart_inventory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test karne ke liye ke connection theek hai ya nahi
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database: smart_inventory!');
        connection.release(); // Connection ko foran wapas pool mein bhej den
    })
    .catch(error => {
        console.error('Database se connect hone mein masla aa raha hai: ', error);
    });

// Pool ko doosri files mein istemal karne ke liye export karen
module.exports = pool;