const fetch = require('node-fetch');

const ORS_KEY = (process.env.ORS_API_KEY || '').trim();
if (!ORS_KEY) {
    console.warn('[mapService] ORS_API_KEY is missing');
}

const orsRequest = async (url, options = {}) => {
    if (!ORS_KEY) {
        const err = new Error('Thiếu ORS_API_KEY');
        err.status = 500;
        throw err;
    }
    const resp = await fetch(url, {
        ...options,
        headers: {
            'Authorization': ORS_KEY,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        const err = new Error(`ORS error ${resp.status}: ${text}`);
        err.status = resp.status;
        throw err;
    }
    return resp.json();
};

// Tính route lái xe; trả distance (m), duration (s), geometry (GeoJSON)
exports.getDrivingRoute = async (fromLngLat, toLngLat) => {
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
    const body = {
        coordinates: [
            fromLngLat, // [lng, lat]
            toLngLat
        ],
        format: 'geojson'
    };
    const data = await orsRequest(url, { method: 'POST', body: JSON.stringify(body) });
    const feature = data.features?.[0];
    const route = data.routes?.[0];
    const featureSummary = feature?.properties?.summary;
    const featureSegment = feature?.properties?.segments?.[0];
    const routeSummary = route?.summary;
    const routeSegment = route?.segments?.[0];

    const distance = Number(
        featureSummary?.distance ??
        featureSegment?.distance ??
        routeSummary?.distance ??
        routeSegment?.distance
    );
    const duration = Number(
        featureSummary?.duration ??
        featureSegment?.duration ??
        routeSummary?.duration ??
        routeSegment?.duration
    );
    if (!Number.isFinite(distance) || distance <= 0) {
        console.error('[ORS] invalid distance', {
            from: fromLngLat,
            to: toLngLat,
            summary,
            raw: data
        });
        const err = new Error('ORS trả về distance không hợp lệ');
        err.status = 502;
        throw err;
    }
    return {
        distance,
        duration: Number.isFinite(duration) ? duration : null,
        geometry: feature?.geometry || route?.geometry || null
    };
};

// Forward geocode
exports.geocodeSearch = async (text, extra = {}) => {
    const params = new URLSearchParams({ text, size: extra.size || 5 });
    if (extra.boundary_country) params.set('boundary.country', extra.boundary_country);
    const url = `https://api.openrouteservice.org/geocode/search?${params.toString()}`;
    return orsRequest(url);
};

// Reverse geocode
exports.geocodeReverse = async (lat, lng, extra = {}) => {
    const params = new URLSearchParams({
        'point.lat': lat,
        'point.lon': lng,
        size: extra.size || 1
    });
    const url = `https://api.openrouteservice.org/geocode/reverse?${params.toString()}`;
    return orsRequest(url);
};
