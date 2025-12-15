const { getDrivingRoute, geocodeSearch, geocodeReverse } = require('../services/mapService');

const haversine = (fromLngLat, toLngLat) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(toLngLat[1] - fromLngLat[1]);
    const dLng = toRad(toLngLat[0] - fromLngLat[0]);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(fromLngLat[1])) *
            Math.cos(toRad(toLngLat[1])) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Tính quãng đường/thời gian giữa 2 điểm (theo tuyến lái xe)
exports.getDistance = async (req, res) => {
    try {
        const { from, to } = req.body || {};
        if (!Array.isArray(from) || !Array.isArray(to) || from.length !== 2 || to.length !== 2) {
            return res.status(400).json({ message: 'Thiếu tọa độ from/to [lng, lat].' });
        }
        const parsedFrom = [Number(from[0]), Number(from[1])];
        const parsedTo = [Number(to[0]), Number(to[1])];
        if (!parsedFrom.every(Number.isFinite) || !parsedTo.every(Number.isFinite)) {
            return res.status(400).json({ message: 'Tọa độ không hợp lệ.' });
        }
        const result = await getDrivingRoute(from, to);
        console.log('[map] distance ok', { from, to, distance: result?.distance, duration: result?.duration });
        res.json(result);
    } catch (err) {
        console.error('getDistance error:', err);
        // Fallback Haversine nếu ORS lỗi/NaN
        try {
            const { from, to } = req.body || {};
            if (Array.isArray(from) && Array.isArray(to) && from.length === 2 && to.length === 2) {
                const fallbackDist = haversine(from.map(Number), to.map(Number));
                return res.json({
                    distance: fallbackDist,
                    duration: null,
                    geometry: null,
                    approx: true,
                    message: err.message || 'ORS lỗi, dùng khoảng cách ước tính'
                });
            }
        } catch (e) {
            console.error('fallback haversine error:', e);
        }
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Forward geocode
exports.search = async (req, res) => {
    try {
        const { text } = req.query;
        if (!text) return res.status(400).json({ message: 'Thiếu text.' });
        const result = await geocodeSearch(text, req.query);
        res.json(result);
    } catch (err) {
        console.error('geocode search error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Reverse geocode
exports.reverse = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ message: 'Thiếu lat/lng.' });
        const result = await geocodeReverse(Number(lat), Number(lng), req.query);
        res.json(result);
    } catch (err) {
        console.error('geocode reverse error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
