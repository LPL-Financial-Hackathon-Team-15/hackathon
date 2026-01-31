// marketCache.js
let cachedData = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getMarketData = async () => {
    const now = Date.now();

    if (cachedData && cacheTime && (now - cacheTime < CACHE_DURATION)) {
        return cachedData; // Return cached data
    }

    // Add 'return' here to return the Promise
    return fetch(`http://ec2-3-142-36-77.us-east-2.compute.amazonaws.com:8000/news/market/summary`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch market analysis');
            return res.json();
        })
        .then(data => {
            cachedData = data;
            cacheTime = now;
            return data; // This return is correct
        })
        .catch(err => {
            console.error(err);
            throw err; // Throw instead of return so caller knows it failed
        });
};

export const clearCache = () => {
    cachedData = null;
    cacheTime = null;
};