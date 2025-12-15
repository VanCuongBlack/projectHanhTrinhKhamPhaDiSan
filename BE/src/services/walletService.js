const { VNPay } = require('vnpay');
const pool = require('../config/db');
const walletRepo = require('../repositories/walletRepository');
const voucherRepo = require('../repositories/voucherRepository');

const formatDate = (date = new Date()) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return (
        date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
};

const getClientIp = (req) =>
    (() => {
        const raw =
            (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            '';
        if (raw === '::1' || raw === '::ffff:127.0.0.1') return '127.0.0.1';
        return raw || '127.0.0.1';
    })();

let vnpayClient;
const getVnpConfig = () => {
    const cfg = {
        tmnCode: (process.env.VNP_TMN_CODE || '').trim(),
        hashSecret: (process.env.VNP_HASH_SECRET || '').trim(),
        returnUrl: (process.env.VNP_RETURN_URL || '').trim(),
        host: (process.env.VNP_HOST || 'https://sandbox.vnpayment.vn').trim(),
        version: process.env.VNP_VERSION || '2.1.0',
        endpoint: process.env.VNP_PAY_ENDPOINT || 'paymentv2/vpcpay.html',
        testMode: (process.env.VNP_TEST_MODE || 'true').toLowerCase() !== 'false'
    };
    if (!cfg.tmnCode || !cfg.hashSecret || !cfg.returnUrl) {
        const err = new Error('Thiếu cấu hình VNPAY. Vui lòng kiểm tra biến môi trường.');
        err.status = 500;
        throw err;
    }
    return cfg;
};
const getVnpayClient = () => {
    if (vnpayClient) return vnpayClient;
    const cfg = getVnpConfig();
    vnpayClient = new VNPay({
        tmnCode: cfg.tmnCode,
        secureSecret: cfg.hashSecret,
        vnpayHost: cfg.host,
        testMode: cfg.testMode,
        hashAlgorithm: 'SHA512',
        endpoints: { paymentEndpoint: cfg.endpoint }
    });
    return vnpayClient;
};

exports.requestTopUp = async (req, userId, { so_tien, bankCode, noi_dung }) => {
    if (!so_tien || Number(so_tien) <= 0) {
        const err = new Error('Số tiền nạp phải lớn hơn 0.');
        err.status = 400;
        throw err;
    }
    const amountInt = Math.round(Number(so_tien)); // đơn vị VND nguyên

    const vnpConfig = getVnpConfig();
    const vnpay = getVnpayClient();

    const note = noi_dung || 'Nạp ví qua VNPAY';
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await walletRepo.ensureWallet(conn, userId);

        const txnId = await walletRepo.insertTransaction(conn, {
            userId,
            so_tien,
            loai_giao_dich: 'nap_tien',
            noi_dung: note,
            trang_thai: 'cho_duyet'
        });

        const ipAddr = getClientIp(req);
        const createDate = formatDate();

        // Lưu ý: thư viện vnpay đã tự nhân 100 khi build URL, nên truyền số VND gốc
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amountInt,
            vnp_IpAddr: ipAddr,
            vnp_ReturnUrl: vnpConfig.returnUrl,
            vnp_TxnRef: String(txnId),
            vnp_OrderInfo: `Nap vi ${txnId}`,
            vnp_OrderType: 'other',
            vnp_BankCode: bankCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_CreateDate: createDate,
            vnp_ExpireDate: formatDate(new Date(Date.now() + 15 * 60 * 1000)),
            vnp_Version: vnpConfig.version
        });

        await conn.commit();
        console.log('[VNPAY] Created txn', { txnId, amountInt, paymentUrl, ipAddr, createDate, bankCode });
        return { txnId, paymentUrl };
    } catch (err) {
        console.error('[VNPAY] requestTopUp error', err);
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.payWithWallet = async (userId, payload) => {
    const { so_tien, noi_dung, ma_voucher, ma_partner, tong_tien_goc } = payload;
    if (!so_tien || Number(so_tien) <= 0) {
        const err = new Error('Số tiền thanh toán phải lớn hơn 0.');
        err.status = 400;
        throw err;
    }
    const amount = Number(so_tien); // số tiền thực tế user trả (đã trừ voucher)
    const gross = tong_tien_goc !== undefined && tong_tien_goc !== null && tong_tien_goc !== ''
        ? Number(tong_tien_goc)
        : amount; // giá gốc tour (chưa trừ voucher), mặc định = amount nếu không truyền

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await walletRepo.ensureWallet(conn, userId);

        // Voucher
        let discount = 0;
        let voucherUserId = null;
        if (ma_voucher) {
            const voucher = await voucherRepo.getUserVoucher(userId, ma_voucher);
            if (!voucher) {
                const err = new Error('Voucher không thuộc người dùng hoặc không tồn tại.');
                err.status = 404;
                throw err;
            }
            const now = new Date();
            if (voucher.da_dung) {
                const err = new Error('Voucher đã được sử dụng.');
                err.status = 400;
                throw err;
            }
            if (voucher.trang_thai !== 'active') {
                const err = new Error('Voucher không còn hiệu lực.');
                err.status = 400;
                throw err;
            }
            if (voucher.ngay_bat_dau && now < new Date(voucher.ngay_bat_dau)) {
                const err = new Error('Voucher chưa đến thời gian sử dụng.');
                err.status = 400;
                throw err;
            }
            if (voucher.ngay_ket_thuc && now > new Date(voucher.ngay_ket_thuc)) {
                const err = new Error('Voucher đã hết hạn.');
                err.status = 400;
                throw err;
            }
            discount = Math.min(amount * Number(voucher.giam_phan_tram) / 100, Number(voucher.giam_toi_da));
            voucherUserId = voucher.voucher_user_id;
        }
        const payable = Math.max(0, amount - discount);

        const locked = await walletRepo.lockBalance(conn, userId);
        if (Number(locked.so_du || 0) < payable) {
            const err = new Error('Số dư không đủ.');
            err.status = 400;
            throw err;
        }

        await walletRepo.updateBalance(conn, userId, -payable);
        const txId = await walletRepo.insertTransaction(conn, {
            userId,
            so_tien: payable,
            loai_giao_dich: 'thanh_toan',
            noi_dung: noi_dung || (ma_voucher ? `Thanh toán (voucher ${ma_voucher})` : 'Thanh toán dịch vụ'),
            trang_thai: 'thanh_cong'
        });
        if (voucherUserId) {
            await voucherRepo.markUsed(voucherUserId);
        }

        // Chia tiền cho đối tác nếu có
        if (ma_partner) {
            const partnerRepo = require('../repositories/partnerRepository');
            const partner = await partnerRepo.findById(ma_partner);
            if (partner && partner.ma_nguoi_dung) {
                const partnerPercent = Number(partner.commission_percent || 0);
                const partnerShareBase = Number.isFinite(gross) && gross > 0 ? gross : payable;
                const partnerShare = partnerShareBase * (1 - partnerPercent / 100);
                await walletRepo.ensureWallet(conn, partner.ma_nguoi_dung);
                await walletRepo.updateBalance(conn, partner.ma_nguoi_dung, partnerShare);
                await walletRepo.insertTransaction(conn, {
                    userId: partner.ma_nguoi_dung,
                    so_tien: partnerShare,
                    loai_giao_dich: 'thanh_toan',
                    noi_dung: `Nhận tiền tour #partner ${ma_partner}`,
                    trang_thai: 'thanh_cong'
                });
            }
        }

        await conn.commit();
        return { txId, so_du_con_lai: Number(locked.so_du || 0) - payable, discount, payable };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getHistory = async (userId) => {
    const wallet = await walletRepo.getWallet(userId);
    const transactions = await walletRepo.getHistory(userId);
    return {
        so_du: wallet?.so_du || 0,
        currency: wallet?.currency || 'VND',
        lich_su: transactions
    };
};

const assertWithdrawRole = async (conn, userId) => {
    const [partners] = await conn.query(
        'SELECT 1 FROM Partner WHERE ma_nguoi_dung = ? AND trang_thai = "active" LIMIT 1',
        [userId]
    );
    if (partners.length > 0) return 'partner';

    const [guides] = await conn.query(
        'SELECT 1 FROM FreelanceGuide WHERE ma_nguoi_dung = ? AND trang_thai = "active" LIMIT 1',
        [userId]
    );
    if (guides.length > 0) return 'guide';

    const err = new Error('Chỉ đối tác hoặc hướng dẫn viên active mới được rút tiền.');
    err.status = 403;
    throw err;
};

exports.requestWithdraw = async (userId, _role, { so_tien, noi_dung, so_tai_khoan, ngan_hang, chu_tai_khoan }) => {
    if (!so_tien || Number(so_tien) <= 0) {
        const err = new Error('Số tiền rút phải lớn hơn 0.');
        err.status = 400;
        throw err;
    }
    if (!so_tai_khoan || !ngan_hang) {
        const err = new Error('Vui lòng cung cấp số tài khoản và ngân hàng thụ hưởng.');
        err.status = 400;
        throw err;
    }

    const amount = Number(so_tien);
    const accountInfo = `${so_tai_khoan} | ${ngan_hang}${chu_tai_khoan ? ` | ${chu_tai_khoan}` : ''}`;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await assertWithdrawRole(conn, userId);
        await walletRepo.ensureWallet(conn, userId);
        const locked = await walletRepo.lockBalance(conn, userId);
        if (Number(locked.so_du || 0) < amount) {
            const err = new Error('Số dư không đủ để rút.');
            err.status = 400;
            throw err;
        }

        // Trừ tiền ngay khi tạo yêu cầu
        const newBalance = Number(locked.so_du || 0) - amount;
        await walletRepo.updateBalance(conn, userId, -amount);

        const withdrawId = await walletRepo.insertWithdrawRequest(conn, {
            userId,
            amount,
            phuong_thuc: ngan_hang,
            tai_khoan_ngan_hang: accountInfo
        });
        const txId = await walletRepo.insertTransaction(conn, {
            userId,
            so_tien: amount,
            loai_giao_dich: 'rut_tien',
            service_type: 'other',
            ref_type: 'withdraw',
            ref_id: withdrawId,
            balance_after: newBalance,
            noi_dung: noi_dung || `Yêu cầu rút tiền • ${ngan_hang}`,
            trang_thai: 'cho_duyet'
        });

        await conn.commit();
        return { withdrawId, txId, so_du_con_lai: newBalance };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.listWithdrawRequests = async (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const status = query.status || null;
    const { rows, total } = await walletRepo.listWithdrawRequests(limit, offset, status);
    return { page, limit, total, data: rows };
};

exports.reviewWithdraw = async (adminId, id, action, ly_do) => {
    if (!['da_duyet', 'tu_choi'].includes(action)) {
        const err = new Error('Trạng thái không hợp lệ, chỉ chấp nhận da_duyet hoặc tu_choi.');
        err.status = 400;
        throw err;
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const reqRow = await walletRepo.getWithdrawForUpdate(conn, id);
        if (!reqRow) {
            const err = new Error('Không tìm thấy yêu cầu rút tiền.');
            err.status = 404;
            throw err;
        }
        if (reqRow.trang_thai !== 'cho_duyet') {
            const err = new Error('Yêu cầu đã được xử lý trước đó.');
            err.status = 400;
            throw err;
        }

        const tx = await walletRepo.findTransactionByRef(conn, 'withdraw', id);

        if (action === 'da_duyet') {
            await walletRepo.updateWithdrawStatus(conn, id, 'da_duyet');
            if (tx) {
                await walletRepo.updateTransactionStatus(conn, tx.id, 'thanh_cong', ly_do ? ` | admin: ${ly_do}` : '');
            }
            await conn.commit();
            return { status: 'da_duyet' };
        }

        // Từ chối: hoàn lại tiền
        await walletRepo.ensureWallet(conn, reqRow.ma_nguoi_dung);
        const locked = await walletRepo.lockBalance(conn, reqRow.ma_nguoi_dung);
        const refundBalance = Number(locked.so_du || 0) + Number(reqRow.so_tien);
        await walletRepo.updateBalance(conn, reqRow.ma_nguoi_dung, Number(reqRow.so_tien));
        await walletRepo.updateWithdrawStatus(conn, id, 'tu_choi');
        if (tx) {
            await walletRepo.updateTransactionStatus(conn, tx.id, 'that_bai', ly_do ? ` | admin: ${ly_do}` : ' | admin từ chối');
        }
        // ghi nhận hoàn tiền
        await walletRepo.insertTransaction(conn, {
            userId: reqRow.ma_nguoi_dung,
            so_tien: reqRow.so_tien,
            loai_giao_dich: 'hoan_tien',
            service_type: 'other',
            ref_type: 'withdraw',
            ref_id: id,
            balance_after: refundBalance,
            noi_dung: ly_do ? `Hoàn tiền rút - ${ly_do}` : 'Hoàn tiền yêu cầu rút bị từ chối',
            trang_thai: 'thanh_cong'
        });

        await conn.commit();
        return { status: 'tu_choi' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.vnpayReturn = async (query) => {
    const vnpay = getVnpayClient();
    const verify = vnpay.verifyReturnUrl(query);
    if (!verify.isVerified) {
        const err = new Error('Chữ ký không hợp lệ.');
        err.status = 400;
        throw err;
    }

    const txnRef = verify.vnp_TxnRef;
    const amountRaw = Number(verify.vnp_Amount);
    const responseCode = verify.vnp_ResponseCode;
    const transactionStatus = verify.vnp_TransactionStatus;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [txRows] = await conn.query(
            'SELECT * FROM LichSuVi WHERE id = ? AND loai_giao_dich = "nap_tien" FOR UPDATE',
            [txnRef]
        );
        if (txRows.length === 0) {
            const err = new Error('Không tìm thấy giao dịch.');
            err.status = 404;
            throw err;
        }
        const tx = txRows[0];
        if (tx.trang_thai !== 'cho_duyet') {
            await conn.commit();
            return { trang_thai: tx.trang_thai, txnRef };
        }
        const expectedAmount = Math.round(Number(tx.so_tien));
        // Một số cấu hình VNPay trả vnp_Amount đã nhân 100, một số không; normalize
        let amountFromVnp;
        if (amountRaw === expectedAmount) {
            amountFromVnp = amountRaw;
        } else if (amountRaw === expectedAmount * 100) {
            amountFromVnp = expectedAmount;
        } else {
            amountFromVnp = Math.round(amountRaw / 100);
        }

        if (expectedAmount !== amountFromVnp) {
            await conn.query(
                'UPDATE LichSuVi SET trang_thai = ?, noi_dung = CONCAT(IFNULL(noi_dung,""), " | Sai số tiền VNPAY") WHERE id = ?',
                ['that_bai', txnRef]
            );
            await conn.commit();
            const err = new Error(`Số tiền không khớp (expect ${expectedAmount}, got ${amountRaw}, normalized ${amountFromVnp}).`);
            err.status = 400;
            throw err;
        }

        // Chấp nhận thành công nếu transactionStatus === '00' (ưu tiên), và/hoặc responseCode === '00'
        if (transactionStatus === '00' || responseCode === '00') {
            await walletRepo.ensureWallet(conn, tx.ma_nguoi_dung);
            await walletRepo.updateBalance(conn, tx.ma_nguoi_dung, amountFromVnp);
            await conn.query(
                'UPDATE LichSuVi SET trang_thai = ? WHERE id = ?',
                ['thanh_cong', txnRef]
            );
            await conn.commit();
            return { trang_thai: 'thanh_cong', txnRef, amount: amountFromVnp };
        }

        await conn.query(
            'UPDATE LichSuVi SET trang_thai = ? WHERE id = ?',
            ['that_bai', txnRef]
        );
        await conn.commit();
        const err = new Error(`Giao dịch thất bại. ResponseCode=${responseCode}, TxStatus=${transactionStatus}`);
        err.status = 400;
        throw err;
    } catch (err) {
        console.error('[VNPAY] return error', { query, txnRef, amountRaw, responseCode, transactionStatus, message: err.message });
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
