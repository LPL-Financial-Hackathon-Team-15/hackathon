// components/PinnedStocks.jsx
import { useState } from 'react'
import HomeStockCard from './HomeStockCard.jsx'

export default function PinnedStocks() {
    const [pinnedStocks, setPinnedStocks] = useState([
        { ticker: "S&P500", costChange: "+0.70$", percentageChange: "+0.5%" },
        { ticker: "AAPL", costChange: "-2.30$", percentageChange: "-1.2%" },
        { ticker: "GOOGL", costChange: "+5.40$", percentageChange: "+2.1%" },
        { ticker: "TSLA", costChange: "-8.50$", percentageChange: "-3.4%" },
        { ticker: "MSFT", costChange: "+3.20$", percentageChange: "+0.8%" },
        { ticker: "AMZN", costChange: "+12.10$", percentageChange: "+4.2%" },
        { ticker: "NVDA", costChange: "-6.70$", percentageChange: "-1.9%" },
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
                {pinnedStocks.map((stock, index) => (
                    <HomeStockCard
                        key={index}
                        ticker={stock.ticker}
                        costChange={stock.costChange}
                        percentageChange={stock.percentageChange}
                        onDelete={() => handleDelete(index)}
                    />
                ))}
            </div>
        </div>
    )
}