const pool = require('../config/db');
const checkinRepo = require('../repositories/checkinRepository');
const voucherRepo = require('../repositories/voucherRepository');

const DEFAULT_MILESTONES = [5, 10, 20];
let milestonesCache = null;
const DAILY_LIMIT = Number(process.env.CHECKIN_DAILY_LIMIT || 10);
// Theo yêu cầu: bán kính 3km; cho phép override qua env
const RADIUS_METERS = Number(process.env.CHECKIN_RADIUS_METERS || 3000);
const VOUCHER_TEMPLATE = {
    giam_phan_tram: 10,
    giam_toi_da: 200000,
    ngay_bat_dau: () => new Date(),
    ngay_ket_thuc: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    mo_ta: (moc) => `Tặng voucher khi đạt ${moc} điểm check-in`
};

const ensureConfigTable = async () => {
    await pool.query(
        `CREATE TABLE IF NOT EXISTS CheckinConfig (
            config_key VARCHAR(100) PRIMARY KEY,
            config_value TEXT
        )`
    );
};

const loadMilestones = async () => {
    if (Array.isArray(milestonesCache) && milestonesCache.length > 0) return milestonesCache;
    await ensureConfigTable();
    const [rows] = await pool.query('SELECT config_value FROM CheckinConfig WHERE config_key = "milestones" LIMIT 1');
    if (rows.length > 0) {
        try {
            const parsed = JSON.parse(rows[0].config_value);
            if (Array.isArray(parsed) && parsed.length > 0) {
                milestonesCache = parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
                if (milestonesCache.length > 0) return milestonesCache;
            }
        } catch (_) {
            // ignore parse errors
        }
    }
    // fallback default and persist
    milestonesCache = DEFAULT_MILESTONES;
    await pool.query(
        `INSERT INTO CheckinConfig (config_key, config_value)
         VALUES ("milestones", ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [JSON.stringify(DEFAULT_MILESTONES)]
    );
    return milestonesCache;
};

const saveMilestones = async (arr) => {
    milestonesCache = arr;
    await ensureConfigTable();
    await pool.query(
        `INSERT INTO CheckinConfig (config_key, config_value)
         VALUES ("milestones", ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [JSON.stringify(arr)]
    );
};

const ensureVoucherForMilestone = async (conn, milestone) => {
    const title = `Voucher mốc ${milestone} điểm`;
    const [exists] = await conn.query('SELECT ma_voucher FROM Voucher WHERE tieu_de = ? LIMIT 1', [title]);
    if (exists.length > 0) return exists[0].ma_voucher;

    const [created] = await conn.query(
        `INSERT INTO Voucher (code, tieu_de, mo_ta, giam_phan_tram, giam_toi_da, ngay_bat_dau, ngay_ket_thuc, trang_thai, so_luong)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
            `MOC_${milestone}`,
            title,
            VOUCHER_TEMPLATE.mo_ta(milestone),
            VOUCHER_TEMPLATE.giam_phan_tram,
            VOUCHER_TEMPLATE.giam_toi_da,
            VOUCHER_TEMPLATE.ngay_bat_dau(),
            VOUCHER_TEMPLATE.ngay_ket_thuc(),
            1000000
        ]
    );
    return created.insertId;
};

exports.checkIn = async (userId, ma_dia_diem, payload = {}) => {
    if (!ma_dia_diem) {
        const err = new Error('Thiếu mã địa điểm.');
        err.status = 400;
        throw err;
    }

    const place = await checkinRepo.findPlace(ma_dia_diem);
    if (!place) {
        const err = new Error('Địa điểm không tồn tại.');
        err.status = 404;
        throw err;
    }

    // Kiểm tra GPS nếu có gửi từ client
    const checkGps = (lat, lng) => {
        if (lat === undefined || lng === undefined || place.toado_lat == null || place.toado_lng == null) return null;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371000; // earth radius in meters
        const dLat = toRad(lat - place.toado_lat);
        const dLng = toRad(lng - place.toado_lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(place.toado_lat)) * Math.cos(toRad(lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // giới hạn tổng số check-in/ngày cho user
        if (DAILY_LIMIT > 0) {
            const todayCount = await checkinRepo.countToday(conn, userId);
            if (todayCount >= DAILY_LIMIT) {
                const err = new Error(`Bạn đã đạt giới hạn ${DAILY_LIMIT} check-in trong hôm nay.`);
                err.status = 429;
                throw err;
            }
        }

        // Mỗi địa điểm chỉ được check-in 1 lần duy nhất
        const existedEver = await checkinRepo.hasCheckinEver(conn, userId, ma_dia_diem);
        if (existedEver) {
            const err = new Error('Bạn đã check-in địa điểm này rồi.');
            err.status = 409;
            throw err;
        }

        // Nếu client gửi lat/lng, kiểm tra bán kính
        if (RADIUS_METERS > 0) {
            const { lat, lng } = payload;
            const distance = checkGps(Number(lat), Number(lng));
            if (distance !== null && distance > RADIUS_METERS) {
                const err = new Error(`Bạn đang cách địa điểm khoảng ${Math.round(distance)}m, vượt quá giới hạn (${RADIUS_METERS}m).`);
                err.status = 400;
                throw err;
            }
        }

        const prevPoints = await checkinRepo.getPoints(conn, userId);
        const newPoints = prevPoints + 1;
        await checkinRepo.setPoints(conn, userId, newPoints);

        let checkinId;
        try {
            checkinId = await checkinRepo.insertCheckin(conn, userId, ma_dia_diem);
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                const err = new Error('Bạn đã check-in địa điểm này rồi.');
                err.status = 409;
                throw err;
            }
            throw e;
        }

        const milestones = await loadMilestones();
        const achieved = milestones.filter((moc) => newPoints >= moc);
        const awarded = [];
        for (const milestone of achieved) {
            const voucherId = await ensureVoucherForMilestone(conn, milestone);
            try {
                const assigned = await voucherRepo.assignToUser(voucherId, userId);
                if (assigned) {
                    awarded.push({ milestone, ma_voucher: voucherId });
                }
            } catch (_) {
                // ignore duplicate
            }
        }

        await conn.commit();
        return { checkin_id: checkinId, points: newPoints, vouchers_awarded: awarded };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getSummary = async (userId) => {
    const points = await checkinRepo.getPointsReadonly(userId);
    const list = await checkinRepo.listCheckins(userId);
    return { points, checkins: list };
};

exports.getConfig = async () => {
    const milestones = await loadMilestones();
    return {
        milestones,
        daily_limit: DAILY_LIMIT,
        radius_meters: RADIUS_METERS,
        voucher_template: {
            giam_phan_tram: VOUCHER_TEMPLATE.giam_phan_tram,
            giam_toi_da: VOUCHER_TEMPLATE.giam_toi_da
        }
    };
};

const assignForExistingUsers = async (milestones) => {
    if (!Array.isArray(milestones) || milestones.length === 0) return;
    for (const m of milestones) {
        const [users] = await pool.query('SELECT ma_nguoi_dung FROM UserPoints WHERE points >= ?', [m]);
        if (!users || users.length === 0) continue;
        const userIds = users.map((u) => u.ma_nguoi_dung);
        let voucherId = null;
        const conn = await pool.getConnection();
        try {
            voucherId = await ensureVoucherForMilestone(conn, m);
            if (!voucherId) continue;
            const inserted = await voucherRepo.assignToUsers(voucherId, userIds, conn);
            console.log('[checkin] assign existing users milestone', m, 'voucher', voucherId, 'inserted', inserted);
        } catch (e) {
            console.error('[checkin] assign existing users error', e);
        } finally {
            conn.release();
        }
    }
};

exports.updateConfig = async ({ milestones }) => {
    if (!Array.isArray(milestones) || milestones.length === 0) {
        const err = new Error('Danh sách mốc điểm không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const parsed = milestones
        .map((m) => Number(m))
        .filter((m) => Number.isFinite(m) && m > 0)
        .sort((a, b) => a - b);
    if (parsed.length === 0) {
        const err = new Error('Danh sách mốc điểm không hợp lệ.');
        err.status = 400;
        throw err;
    }
    await saveMilestones(parsed);
    // Trao voucher cho những user đã đủ điểm theo mốc mới
    await assignForExistingUsers(parsed);
    return { milestones: parsed };
};
