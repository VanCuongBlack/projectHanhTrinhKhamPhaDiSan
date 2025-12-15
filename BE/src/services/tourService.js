const tourRepository = require('../repositories/tourRepository');

const safeParse = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch (_) {
        return value;
    }
};

const validatePayload = (payload, isCreate = false) => {
    if (isCreate && !payload.tieu_de) {
        const err = new Error('Tên tour là bắt buộc.');
        err.status = 400;
        throw err;
    }

    const sanitized = { ...payload };
    if (sanitized.tieu_de) sanitized.tieu_de = sanitized.tieu_de.trim();
    ['so_ngay', 'so_dem', 'gia', 'ma_partner', 'gia_tre_em'].forEach((key) => {
        if (sanitized[key] !== undefined && sanitized[key] !== null && sanitized[key] !== '') {
            const num = Number(sanitized[key]);
            if (Number.isNaN(num)) {
                const err = new Error(`Trường ${key} phải là số.`);
                err.status = 400;
                throw err;
            }
            sanitized[key] = num;
        } else {
            sanitized[key] = null;
        }
    });
    // giữ nguyên chuỗi/JSON
    if (sanitized.lich_trinh && typeof sanitized.lich_trinh !== 'string') {
        sanitized.lich_trinh = JSON.stringify(sanitized.lich_trinh);
    }
    if (sanitized.media && typeof sanitized.media !== 'string') {
        sanitized.media = JSON.stringify(sanitized.media);
    }
    return sanitized;
};

exports.listTours = async () => {
    const tours = await tourRepository.findAll();
    return tours.map((t) => ({
        ...t,
        lich_trinh: safeParse(t.lich_trinh),
        media: safeParse(t.media),
    }));
};

exports.getTour = async (id) => {
    const tour = await tourRepository.findById(id);
    if (!tour) {
        const err = new Error('Không tìm thấy tour.');
        err.status = 404;
        throw err;
    }
    return {
        ...tour,
        lich_trinh: safeParse(tour.lich_trinh),
        media: safeParse(tour.media),
    };
};

exports.createTour = async (payload) => {
    const data = validatePayload(payload, true);
    const id = await tourRepository.create(data);
    return tourRepository.findById(id);
};

exports.updateTour = async (id, payload) => {
    const data = validatePayload(payload, false);
    const affected = await tourRepository.update(id, data);
    if (!affected) {
        const err = new Error('Không tìm thấy tour.');
        err.status = 404;
        throw err;
    }
    return tourRepository.findById(id);
};

exports.deleteTour = async (id) => {
    const affected = await tourRepository.remove(id);
    if (!affected) {
        const err = new Error('Không tìm thấy tour.');
        err.status = 404;
        throw err;
    }
    return true;
};
