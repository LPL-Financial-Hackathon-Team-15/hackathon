// components/PinnedStocks.jsx
import { useState } from 'react'
import StockCard from './StockCard.jsx'

export default function PinnedStocks() {
    const [pinnedStocks, setPinnedStocks] = useState([
        { ticker: "S&P500", name: "S&P 500 Index", currentPrice: 5234.18, costChange: 0.70, percentageChange: 0.5 },
        { ticker: "AAPL", name: "Apple Inc.", currentPrice: 189.25, costChange: -2.30, percentageChange: -1.2 },
        { ticker: "GOOGL", name: "Alphabet Inc.", currentPrice: 142.65, costChange: 5.40, percentageChange: 2.1 },
        { ticker: "TSLA", name: "Tesla, Inc.", currentPrice: 242.84, costChange: -8.50, percentageChange: -3.4 },
        { ticker: "MSFT", name: "Microsoft Corp.", currentPrice: 378.91, costChange: 3.20, percentageChange: 0.8 },
        { ticker: "AMZN", name: "Amazon.com Inc.", currentPrice: 178.35, costChange: 12.10, percentageChange: 4.2 },
        { ticker: "NVDA", name: "NVIDIA Corp.", currentPrice: 875.28, costChange: -6.70, percentageChange: -1.9 },
    ])

    const handleDelete = (index) => {
        setPinnedStocks(pinnedStocks.filter((_, i) => i !== index))
    }

    return (
        <div className="h-[calc(90vh-5rem)] w-1/2 bg-gray-50 border-r border-gray-200 rounded-2xl m-4 flex flex-col">
            {/* Header - Fixed */}
            <div className="bg-gray-50 border-b border-gray-200 rounded-t-2xl p-4">
                <h2 className="text-xl font-bold text-[#07407b]">Pinned Stocks</h2>
            </div>

            {/* Stock Cards - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">

                    {pinnedStocks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-lg font-medium">No pinned stocks yet</p>
                                    <p className="text-sm mt-1">Search and pin stocks on the explore page to track them here</p>
                                </div>
                            ) : (
                    pinnedStocks.map((stock, index) => (
                    <StockCard
                        key={index}
                        ticker={stock.ticker}
                        name={stock.name}
                        currentPrice={stock.currentPrice}
                        costChange={stock.costChange}
                        percentageChange={stock.percentageChange}
                        pinned
                        onDelete={() => handleDelete(index)}
                    />
                )))}

            </div>
        </div>
    )
}