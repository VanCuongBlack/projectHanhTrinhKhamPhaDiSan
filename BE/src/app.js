require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./config/db');


// Debug biến môi trường
console.log('ENV:', process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PORT);

// Test database connection
(async () => {
    try {
        const [rows] = await pool.query('SELECT 1 AS Test');
        console.log('Test query result:', rows);
    } catch (err) {
        console.error('Test query failed:', err);
    }
})();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes placeholder
const userRoutes = require('./routes/userRoutes');
const diaDiemRoutes = require('./routes/diaDiemRoutes');
const leHoiRoutes = require('./routes/leHoiRoutes');
const dacSanRoutes = require('./routes/dacSanRoutes');
const tourDuLichRoutes = require('./routes/tourDuLichRoutes');
const adminRoutes = require('./routes/adminRoutes');
const communityRoutes = require('./routes/communityRoutes');
const walletRoutes = require('./routes/walletRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const regionRoutes = require('./routes/regionRoutes');
const guideRoutes = require('./routes/guideRoutes');
const mapRoutes = require('./routes/mapRoutes');
app.use('/api/users', userRoutes);
app.use('/api/dia-diem', diaDiemRoutes);
app.use('/api/le-hoi', leHoiRoutes);
app.use('/api/dac-san', dacSanRoutes);
app.use('/api/tour-du-lich', tourDuLichRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/region', regionRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/map', mapRoutes);
// Example: app.use('/api/users', require('./routes/userRoutes'));

module.exports = app;
