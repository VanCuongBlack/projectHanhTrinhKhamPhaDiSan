const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Người dùng
router.get('/users', authenticate, authorizeAdmin, adminController.listUsers);
router.patch('/users/:id/lock', authenticate, authorizeAdmin, adminController.lockUser);
router.patch('/users/:id/unlock', authenticate, authorizeAdmin, adminController.unlockUser);
router.delete('/users/:id', authenticate, authorizeAdmin, adminController.deleteUser);

// Đối tác
router.get('/partners', authenticate, authorizeAdmin, adminController.listPartners);

// Tour
router.get('/tours', authenticate, authorizeAdmin, adminController.listTours);

// Guide
router.get('/guides', authenticate, authorizeAdmin, adminController.listGuides);

// Lễ hội / đặc sản / địa điểm
router.get('/dia-diem', authenticate, authorizeAdmin, adminController.listDiaDiem);
router.get('/dac-san', authenticate, authorizeAdmin, adminController.listDacSan);
router.get('/le-hoi', authenticate, authorizeAdmin, adminController.listLeHoi);

// Voucher
router.get('/vouchers', authenticate, authorizeAdmin, adminController.listVouchers);

// Giao dịch ví
router.get('/wallet-transactions', authenticate, authorizeAdmin, adminController.listWalletTransactions);

module.exports = router;
