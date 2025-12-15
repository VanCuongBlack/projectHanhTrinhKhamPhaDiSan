const tourRepo = require('../repositories/tourRepository');
const voucherRepo = require('../repositories/voucherRepository');
const partnerRepo = require('../repositories/partnerRepository');
const walletRepo = require('../repositories/walletRepository');
const pool = require('../config/db');

exports.bookTour = async (userId, payload) => {
    const ma_tour = Number(payload.ma_tour);
    const so_luong = Number(payload.so_luong || 1);
    const ma_voucher = payload.ma_voucher || null;
    if (!ma_tour || so_luong <= 0) {
        const err = new Error('Thiếu tour hoặc số lượng không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const tour = await tourRepo.findById(ma_tour);
    if (!tour) {
        const err = new Error('Không tìm thấy tour.');
        err.status = 404;
        throw err;
    }
    const gross = Number(tour.gia || 0) * Number(so_luong || 1);
    let discount = 0;
    let voucherUserId = null;
    if (ma_voucher) {
        const voucher = await voucherRepo.getUserVoucher(userId, ma_voucher);
        if (!voucher) {
            const err = new Error('Voucher không hợp lệ hoặc không thuộc người dùng.');
            err.status = 404;
            throw err;
        }
        if (voucher.da_dung || voucher.trang_thai !== 'active') {
            const err = new Error('Voucher đã dùng hoặc không còn hiệu lực.');
            err.status = 400;
            throw err;
        }
        const now = new Date();
        if (voucher.ngay_bat_dau && now < new Date(voucher.ngay_bat_dau)) {
            const err = new Error('Voucher chưa tới hạn dùng.');
            err.status = 400;
            throw err;
        }
        if (voucher.ngay_ket_thuc && now > new Date(voucher.ngay_ket_thuc)) {
            const err = new Error('Voucher đã hết hạn.');
            err.status = 400;
            throw err;
        }
        discount = Math.min(gross * Number(voucher.giam_phan_tram) / 100, Number(voucher.giam_toi_da));
        voucherUserId = voucher.voucher_user_id;
    }
    const payable = Math.max(0, gross - discount);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await walletRepo.ensureWallet(conn, userId);
        const locked = await walletRepo.lockBalance(conn, userId);
        if (Number(locked.so_du || 0) < payable) {
            const err = new Error('Số dư không đủ.');
            err.status = 400;
            throw err;
        }

        // create DatTour
        const [res] = await conn.query(
            `INSERT INTO DatTour (ma_nguoi_dung, ma_tour, ma_partner, so_luong, tong_tien, so_tien_thuc_thu, trang_thai, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'paid', NOW())`,
            [userId, ma_tour, tour.ma_partner || null, so_luong, gross, payable]
        );
        const bookingId = res.insertId;

        // deduct user
        await walletRepo.updateBalance(conn, userId, -payable);
        await walletRepo.insertTransaction(conn, {
            userId,
            so_tien: payable,
            loai_giao_dich: 'thanh_toan',
            noi_dung: `Thanh toán tour #${bookingId}`,
            trang_thai: 'thanh_cong'
        });
        if (voucherUserId) {
            await voucherRepo.markUsed(voucherUserId);
        }

        // pay partner
        if (tour.ma_partner) {
            const partner = await partnerRepo.findById(tour.ma_partner);
            if (partner && partner.ma_nguoi_dung) {
                const commission = Number(partner.commission_percent || 0);
                const partnerTake = gross * (1 - commission / 100);
                await walletRepo.ensureWallet(conn, partner.ma_nguoi_dung);
                await walletRepo.updateBalance(conn, partner.ma_nguoi_dung, partnerTake);
                await walletRepo.insertTransaction(conn, {
                    userId: partner.ma_nguoi_dung,
                    so_tien: partnerTake,
                    loai_giao_dich: 'thanh_toan',
                    noi_dung: `Nhận tiền tour #${bookingId}`,
                    trang_thai: 'thanh_cong'
                });
            }
        }

        await conn.commit();
        return { booking_id: bookingId, gross, discount, payable };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.countByPartner = async (partnerId) => {
    const [rows] = await pool.query(
        `SELECT trang_thai, COUNT(*) as cnt
         FROM DatTour
         WHERE ma_partner = ?
         GROUP BY trang_thai`,
        [partnerId]
    );
    const byStatus = rows.reduce((acc, row) => {
        acc[row.trang_thai] = row.cnt;
        return acc;
    }, {});
    const total = rows.reduce((sum, row) => sum + Number(row.cnt || 0), 0);
    return { total, byStatus };
};

exports.listByUser = async (userId) => {
    const [rows] = await pool.query(
        `SELECT dt.*, t.tieu_de, t.anh, t.ma_partner
         FROM DatTour dt
         JOIN Tour t ON dt.ma_tour = t.ma_tour
         WHERE dt.ma_nguoi_dung = ?
         ORDER BY dt.created_at DESC`,
        [userId]
    );
    return rows;
};
