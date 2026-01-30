// components/HomeStockCard.jsx
import { useState } from 'react'

export default function StockCard({ ticker, name, currentPrice, costChange, percentageChange, pinned, onPin, onDelete }) {
    const [showPercentage, setShowPercentage] = useState(false)

    // Determine if change is positive or negative
    const isPositive = costChange >= 0
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600'

    // Format the display values
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
                                    onPin()
                                }}
                                className="text-gray-400 hover:text-[#07407b] transition-colors p-1"
                                title="Pin"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,4v5c0,1.12,0.37,2.16,1,3H9c0.65-0.86,1-1.9,1-3V4H14 M17,2H7C6.45,2,6,2.45,6,3c0,0.55,0.45,1,1,1c0,0,0,0,0,0l1,0v5 c0,1.66-1.34,3-3,3v2h5.97v7l1,1l1-1v-7H19v-2c0,0,0,0,0,0c-1.66,0-3-1.34-3-3V4l0,0c0,0,0,0,0,0l1,0c0.55,0,1-0.45,1-1 C18,2.45,17.55,2,17,2L17,2z" transform="rotate(-45 12 12)"/>
                                </svg>
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