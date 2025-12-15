const express = require('express');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const voucherController = require('../controllers/voucherController');

const router = express.Router();

// Admin tạo voucher mới
router.post('/', authenticate, authorizeAdmin, voucherController.createVoucher);
// Admin gán voucher cho user
router.post('/:voucherId/assign', authenticate, authorizeAdmin, voucherController.assignVoucherToUser);
// Admin gán voucher cho tất cả hoặc danh sách
router.post('/:voucherId/assign-bulk', authenticate, authorizeAdmin, voucherController.assignVoucherBulk);
// User kiểm tra và áp dụng voucher cho tổng tiền
router.post('/apply', authenticate, voucherController.applyVoucher);
// User xem túi voucher
router.get('/my', authenticate, voucherController.listMyVouchers);

module.exports = router;
