// pages/ClickedStock.jsx
import {useParams, useNavigate, useLocation} from 'react-router-dom'
import { useEffect, useState } from 'react'
import Panel from '../components/Panel'
import {StockGraph} from "../components/StockGraph.jsx";

export default function ClickedStock() {
    const { ticker } = useParams()
    const location = useLocation()
    const stockData = location.state // Get the stock data passed from navigation

    // Left side panels
    const [topLeftExpanded, setTopLeftExpanded] = useState(false)
    const [bottomLeftExpanded, setBottomLeftExpanded] = useState(false)
    const [topLeftLoading, setTopLeftLoading] = useState(false)
    const [bottomLeftLoading, setBottomLeftLoading] = useState(false)

    // Right side panels
    const [topRightExpanded, setTopRightExpanded] = useState(false)
    const [bottomRightExpanded, setBottomRightExpanded] = useState(false)
    const [topRightLoading, setTopRightLoading] = useState(false)
    const [bottomRightLoading, setBottomRightLoading] = useState(false)

    // Left side handlers
    const handleTopLeftExpand = () => {
        setTopLeftExpanded(true)
        setBottomLeftExpanded(false)
    }

    const handleBottomLeftExpand = () => {
        setBottomLeftExpanded(true)
        setTopLeftExpanded(false)
    }

    const handleLeftCollapse = () => {
        setTopLeftExpanded(false)
        setBottomLeftExpanded(false)
    }

    // Right side handlers
    const handleTopRightExpand = () => {
        setTopRightExpanded(true)
        setBottomRightExpanded(false)
    }

    const handleBottomRightExpand = () => {
        setBottomRightExpanded(true)
        setTopRightExpanded(false)
    }

    const handleRightCollapse = () => {
        setTopRightExpanded(false)
        setBottomRightExpanded(false)
    }

    const isPositive = stockData?.costChange >= 0
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
    const formattedPrice = stockData?.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const formattedCostChange = stockData ? `${isPositive ? '+' : ''}${stockData.costChange.toFixed(2)}` : ''
    const formattedPercentChange = stockData ? `${isPositive ? '+' : ''}${stockData.percentageChange.toFixed(1)}%` : ''

    return (
        <div className="flex flex-col h-[calc(90vh-5rem)]">
            {/* Main content with 4 panels */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left side - 2 panels */}
                <div className="w-1/2 flex flex-col gap-4 p-4">
                    <Panel
                        title="Company Info"
                        isExpanded={bottomLeftExpanded}
                        isCollapsed={topLeftExpanded}
                        onExpand={handleBottomLeftExpand}
                        onCollapse={handleLeftCollapse}
                        isLoading={bottomLeftLoading}
                    >
                        {stockData ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-3xl font-bold text-[#07407b]">{stockData.name}</h3>
                                    <p className="text-gray-500 text-xl mt-2">{ticker}</p>
                                </div>

                                <div>
                                    <p className="text-gray-600 mb-2">Current Price</p>
                                    <p className="text-5xl font-bold text-gray-900">${formattedPrice}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-600 mb-1">Change ($)</p>
                                        <p className={`text-2xl font-semibold ${changeColor}`}>{formattedCostChange}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 mb-1">Change (%)</p>
                                        <p className={`text-2xl font-semibold ${changeColor}`}>{formattedPercentChange}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No stock data available</p>
                        )}
                    </Panel>

                    <Panel
                        title="Stock Chart"
                        isExpanded={bottomLeftExpanded}
                        isCollapsed={topLeftExpanded}
                        onExpand={handleBottomLeftExpand}
                        onCollapse={handleLeftCollapse}
                        isLoading={bottomLeftLoading}
                    >
                        <StockGraph ticker={ticker}></StockGraph>
                    </Panel>
                </div>

                {/* Right side - 2 panels */}
                <div className="w-1/2 flex flex-col gap-4 p-4">
                    <Panel
                        title="AI Analysis"
                        isExpanded={topRightExpanded}
                        isCollapsed={bottomRightExpanded}
                        onExpand={handleTopRightExpand}
                        onCollapse={handleRightCollapse}
                        isLoading={topRightLoading}
                    >
                        <p className="text-gray-500">AI analysis for {ticker} - Coming soon!</p>
                    </Panel>

                    <Panel
                        title="News & Events"
                        isExpanded={bottomRightExpanded}
                        isCollapsed={topRightExpanded}
                        onExpand={handleBottomRightExpand}
                        onCollapse={handleRightCollapse}
                        isLoading={bottomRightLoading}
                    >
                        <p className="text-gray-500">News and events - Coming soon!</p>
                    </Panel>
                </div>
            </div>
        </div>
    )
}