const mysql = require('mysql2/promise');

// Cấu hình kết nối
const config = {
    host: process.env.DB_HOST, // Địa chỉ server MySQL
    user: process.env.DB_USER, // Tên đăng nhập
    password: process.env.DB_PASS, // Mật khẩu
    database: process.env.DB_NAME, // Tên database
    port: parseInt(process.env.DB_PORT, 10) || 3306, // Cổng MySQL (mặc định là 3306)
};

// Tạo pool kết nối
const pool = mysql.createPool(config);

pool.getConnection()
    .then(() => {
        console.log('Connected to MySQL database successfully!');
    })
    .catch((err) => {
        console.error('Database connection failed!', err);
    });

module.exports = pool;