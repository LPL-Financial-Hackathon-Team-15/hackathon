// components/FilterPanel.jsx
import { useState } from 'react'

export default function FilterPanel({ isOpen, onClose, filters, onFilterChange }) {
    const [localFilters, setLocalFilters] = useState(filters)

    const handleChange = (field, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const applyFilters = () => {
        onFilterChange(localFilters)
        onClose()
    }

    const resetFilters = () => {
        const defaultFilters = {
            sortBy: 'none',
            sortOrder: 'asc',
            minPrice: '',
            maxPrice: '',
            minChange: '',
            maxChange: '',
            minPercentChange: '',
            maxPercentChange: ''
        }
        setLocalFilters(defaultFilters)
        onFilterChange(defaultFilters)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-screen-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[#07407b]">Filter & Sort Stocks</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Sort Options */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                    <select
                        value={localFilters.sortBy}
                        onChange={(e) => handleChange('sortBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                    >
                        <option value="none">None</option>
                        <option value="ticker">Ticker</option>
                        <option value="name">Company Name</option>
                        <option value="currentPrice">Current Price</option>
                        <option value="costChange">Price Change ($)</option>
                        <option value="percentageChange">Price Change (%)</option>
                    </select>
                </div>

                {localFilters.sortBy !== 'none' && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="asc"
                                    checked={localFilters.sortOrder === 'asc'}
                                    onChange={(e) => handleChange('sortOrder', e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Ascending</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="desc"
                                    checked={localFilters.sortOrder === 'desc'}
                                    onChange={(e) => handleChange('sortOrder', e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Descending</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Price Range */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.minPrice}
                            onChange={(e) => handleChange('minPrice', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.maxPrice}
                            onChange={(e) => handleChange('maxPrice', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                        />
                    </div>
                </div>

                {/* Price Change Range ($) */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price Change ($)</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.minChange}
                            onChange={(e) => handleChange('minChange', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.maxChange}
                            onChange={(e) => handleChange('maxChange', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                        />
                    </div>
                </div>

                {/* Price Change Range (%) */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price Change (%)</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.minPercentChange}
                            onChange={(e) => handleChange('minPercentChange', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.maxPercentChange}
                            onChange={(e) => handleChange('maxPercentChange', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b]"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-[#07407b] text-white rounded-lg hover:bg-[#0a5091] transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    )
}