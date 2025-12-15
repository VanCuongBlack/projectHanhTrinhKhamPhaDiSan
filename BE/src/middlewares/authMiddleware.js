const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware xác thực
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access token is missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    console.log('Received token:', token);

    try {
        // Kiểm tra token trong bảng RevokedTokens
        const [rows] = await pool.query('SELECT * FROM RevokedTokens WHERE token = ? AND expires_at > NOW()', [token]);
        if (rows.length > 0) {
            return res.status(401).json({ message: 'Token has been revoked' });
        }

        // Giải mã token
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in .env');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        console.log('JWT_SECRET used for token verification:', process.env.JWT_SECRET);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.vai_tro !== 'admin') {
        return res.status(403).json({ message: 'Yêu cầu quyền quản trị.' });
    }
    next();
};

module.exports = { authenticate, authorizeAdmin };
