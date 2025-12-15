const express = require('express');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const walletController = require('../controllers/walletController');

const router = express.Router();

router.post('/topup', authenticate, walletController.requestTopUp);
router.post('/pay', authenticate, walletController.payWithWallet);
router.get('/history', authenticate, walletController.getHistory);
router.post('/withdraw', authenticate, walletController.requestWithdraw);
router.get('/vnpay-return', walletController.vnpayReturn); // callback/return URL từ VNPAY
router.get('/withdraw/requests', authenticate, authorizeAdmin, walletController.listWithdrawRequests);
router.patch('/withdraw/requests/:id', authenticate, authorizeAdmin, walletController.reviewWithdraw);

module.exports = router;
