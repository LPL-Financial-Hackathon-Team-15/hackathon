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

    addPinned: async (ticker) => {
        const response = await fetch(`${API_BASE_URL}/pinned/${ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Failed to add pinned stock');
        return response.json();
    },

    removePinned: async (ticker) => {
        const response = await fetch(`${API_BASE_URL}/pinned/${ticker}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Failed to remove pinned stock');
        return response.json();
    },

    // Example: Get all stocks
    getAllStocks: async (limit = 500, offset = 0) => {
        const response = await fetch(`${API_BASE_URL}/explore?limit=${limit}&offset=${offset}`);
        if (!response.ok) throw new Error('Failed to fetch stocks');
        const data = await response.json();
        return data.stocks; // Extract the stocks array from the response
    },

    // Add more API calls as needed
};