const pool = require('../config/db');
const guideRepo = require('../repositories/guideRepository');
const scheduleRepo = require('../repositories/guideScheduleRepository');
const bookingRepo = require('../repositories/guideBookingRepository');
const walletRepo = require('../repositories/walletRepository');
const voucherRepo = require('../repositories/voucherRepository');
const guideRepoSimple = require('../repositories/guideRepository');

exports.createSlot = async (userId, payload) => {
    const { ngay, gio_bat_dau, gio_ket_thuc, dia_diem, gia_tien, ghi_chu } = payload;
    if (!ngay || !gio_bat_dau || !gio_ket_thuc) {
        const err = new Error('Thiếu ngày hoặc giờ bắt đầu/kết thúc.');
        err.status = 400;
        throw err;
    }
    if (gio_bat_dau >= gio_ket_thuc) {
        const err = new Error('Giờ bắt đầu phải trước giờ kết thúc.');
        err.status = 400;
        throw err;
    }
    if (gia_tien !== undefined && gia_tien !== null && Number(gia_tien) < 0) {
        const err = new Error('Giá tiền không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const guide = await guideRepo.findGuideByUserId(userId);
    if (!guide || guide.trang_thai !== 'active') {
        const err = new Error('Bạn chưa là hướng dẫn viên active.');
        err.status = 403;
        throw err;
    }
    const overlap = await scheduleRepo.hasOverlap(guide.ma_guide, ngay, gio_bat_dau, gio_ket_thuc);
    if (overlap) {
        const err = new Error('Khung giờ bị trùng với lịch đã có.');
        err.status = 409;
        throw err;
    }
    const id = await scheduleRepo.createSlot(guide.ma_guide, ngay, gio_bat_dau, gio_ket_thuc, dia_diem, gia_tien, ghi_chu);
    return { id };
};

exports.listMySchedule = async (userId) => {
    const guide = await guideRepo.findGuideByUserId(userId);
    if (!guide) return [];
    return scheduleRepo.listMySchedule(guide.ma_guide);
};

exports.searchAvailable = async (ngay) => {
    if (!ngay) {
        return scheduleRepo.listAvailableUpcoming(null, 200);
    }
    return scheduleRepo.listAvailableByDate(ngay);
};

exports.getSlotPublic = async (slotId) => {
    const slot = await scheduleRepo.getSlotPublic(slotId);
    if (!slot) {
        const err = new Error('Không tìm thấy slot.');
        err.status = 404;
        throw err;
    }
    return slot;
};

exports.bookGuide = async (userId, payload) => {
    const { slot_id, so_nguoi = 1, ma_voucher = null } = payload;
    if (!slot_id) {
        const err = new Error('Thiếu slot_id.');
        err.status = 400;
        throw err;
    }
    if (so_nguoi <= 0) {
        const err = new Error('Số người phải > 0.');
        err.status = 400;
        throw err;
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const slot = await scheduleRepo.findSlotForUpdate(conn, slot_id);
        if (!slot || slot.trang_thai !== 'free') {
            const err = new Error('Lịch không còn trống.');
            err.status = 409;
            throw err;
        }
        const guideOwner = await guideRepo.findGuideByUserId(slot.ma_guide);
        if (guideOwner && guideOwner.ma_nguoi_dung === userId) {
            const err = new Error('Bạn không thể tự booking lịch của mình.');
            err.status = 400;
            throw err;
        }
        // tính tiền
        const unitPrice = Number(slot.gia_tien || 0);
        const gross = unitPrice * Number(so_nguoi || 1);
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

        await walletRepo.ensureWallet(conn, userId);
        const locked = await walletRepo.lockBalance(conn, userId);
        if (Number(locked.so_du || 0) < payable) {
            const err = new Error('Số dư không đủ.');
            err.status = 400;
            throw err;
        }

        // tạo booking
        const bookingId = await bookingRepo.createBooking(conn, {
            ma_nguoi_dung: userId,
            ma_guide: slot.ma_guide,
            ngay: slot.ngay,
            gio_bat_dau: slot.gio_bat_dau,
            gio_ket_thuc: slot.gio_ket_thuc,
            so_nguoi,
            tong_tien: gross
        });

        // trừ ví user
        await walletRepo.updateBalance(conn, userId, -payable);
        await walletRepo.insertTransaction(conn, {
            userId,
            so_tien: payable,
            loai_giao_dich: 'thanh_toan',
            noi_dung: `Thanh toán booking guide #${bookingId}`,
            trang_thai: 'thanh_cong'
        });
        if (voucherUserId) {
            await voucherRepo.markUsed(voucherUserId);
        }

        // trả tiền cho guide (gross trừ commission)
        const commission = Number(guideOwner?.commission_percent ?? 10);
        const guideTake = gross * (1 - commission / 100);
        await walletRepo.ensureWallet(conn, guideOwner.ma_nguoi_dung);
        await walletRepo.updateBalance(conn, guideOwner.ma_nguoi_dung, guideTake);
        await walletRepo.insertTransaction(conn, {
            userId: guideOwner.ma_nguoi_dung,
            so_tien: guideTake,
            loai_giao_dich: 'thanh_toan',
            noi_dung: `Nhận tiền booking guide #${bookingId}`,
            trang_thai: 'thanh_cong'
        });

        await scheduleRepo.markSlot(conn, slot_id, 'booked');
        await conn.commit();
        return { booking_id: bookingId, gross, discount, payable, guide_take: guideTake };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.listGuideBookings = async (userId) => {
    const guide = await guideRepo.findGuideByUserId(userId);
    if (!guide) return [];
    return bookingRepo.listByGuideId(guide.ma_guide);
};

exports.listUserBookings = async (userId) => {
    return bookingRepo.listMyBookings(userId);
};
