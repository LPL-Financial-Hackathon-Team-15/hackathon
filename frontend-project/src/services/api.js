// src/services/api.js
const API_BASE_URL = 'http://ec2-3-142-36-77.us-east-2.compute.amazonaws.com:8000';

export const api = {
    // Example: Get stock data
    getStock: async (ticker) => {
        const response = await fetch(`${API_BASE_URL}/stock/${ticker}`);
        if (!response.ok) throw new Error('Failed to fetch stock');
        return response.json();
    },

    getPinned: async () => {
        const response = await fetch(`${API_BASE_URL}/pinned`);
        if (!response.ok) throw new Error('Failed to fetch pinned stocks');
        return response.json();
    },

    // Example: Get all stocks
    getAllStocks: async () => {
        const response = await fetch(`${API_BASE_URL}/explore`);
        if (!response.ok) throw new Error('Failed to fetch stocks');
        return response.json();
    },

    // Add more API calls as needed
};