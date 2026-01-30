// components/HomeStockCard.jsx


import {useState} from "react";

export default function HomeStockCard({ ticker, costChange, percentageChange, onDelete }) {
    const [showPercentage, setShowPercentage] = useState(false)

    // Determine if change is positive or negative
    const isPositive = costChange.startsWith('+')
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600'

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
                {/* Left side - Ticker */}
                <div className="font-semibold text-[#07407b] text-lg">
                    {ticker}
                </div>

                {/* Right side - Change value and controls */}
                <div className="flex items-center gap-2">
                    {/* Change value */}
                    <span className={`font-medium ${changeColor}`}>
                        {showPercentage ? percentageChange : costChange}
                    </span>

                    {/* Toggle button */}
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

                    {/* Delete button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}