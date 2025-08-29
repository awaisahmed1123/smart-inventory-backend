const mysql = require('mysql2/promise');

// createPool ab connection details environment variables se lega
// Yeh Hostinger par aur aapke local computer, dono par kaam karega
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_inventory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database!');
        connection.release();
    })
    .catch(error => {
        console.error('Database connection failed: ', error);
    });

module.exports = pool;