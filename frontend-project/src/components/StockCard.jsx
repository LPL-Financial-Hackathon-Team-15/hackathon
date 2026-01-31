// components/HomeStockCard.jsx
import { useState } from 'react'

export default function StockCard({ ticker, name, currentPrice, costChange, percentageChange, pinned, isLoading, hasError, onPin, onDelete }) {
    const [showPercentage, setShowPercentage] = useState(false)

    const isPositive = costChange >= 0
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600'

    const formattedPrice = currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const formattedCostChange = `${isPositive ? '+' : ''}${costChange.toFixed(2)}`
    const formattedPercentageChange = `${isPositive ? '+' : ''}${percentageChange.toFixed(1)}%`

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            {/* First row - Ticker, Price, Delete */}
            <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-[#07407b] text-lg">{ticker}</div>
                <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold text-gray-900">${formattedPrice}</div>
                    {
                        pinned ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete()
                                }}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Remove"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"/>
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isLoading) onPin()
                                }}
                                disabled={isLoading}
                                className={`transition-colors p-1 relative ${
                                    hasError
                                        ? 'text-red-600'
                                        : 'text-gray-400 hover:text-[#07407b]'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={hasError ? "Failed to pin" : "Pin"}
                            >
                                {isLoading ? (
                                    // Loading spinner
                                    <div className="h-5 w-5 border-2 border-[#07407b] border-t-transparent rounded-full animate-spin"></div>
                                ) : hasError ? (
                                    // Error icon
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    // Diagonal outline pin
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" transform="rotate(45 12 12)"/>
                                    </svg>
                                )}
                            </button>
                        )
                    }
                </div>
            </div>

            {/* Second row - Name, Change, Toggle */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">{name}</div>
                <div className="flex items-center gap-2">
          <span className={`font-medium ${changeColor}`}>
            {showPercentage ? formattedPercentageChange : formattedCostChange}
          </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowPercentage(!showPercentage)
                        }}
                        className="text-gray-400 hover:text-[#07407b] transition-colors p-1"
                        title="Toggle view"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}