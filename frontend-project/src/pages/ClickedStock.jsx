// pages/ClickedStock.jsx
import {useParams, useNavigate, useLocation} from 'react-router-dom'
import { useEffect, useState } from 'react'
import Panel from '../components/Panel'
import {StockGraph} from "../components/StockGraph.jsx";
import {api} from "../services/api.js";

export default function ClickedStock() {
    const { ticker } = useParams()
    const location = useLocation()
    const stockData = location.state // Get the stock data passed from navigation

    const [stockHistory, setStockHistory] = useState(null)
    const [historyLoading, setHistoryLoading] = useState(true)


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


    useEffect(() => {
        const fetchStockHistory = async () => {
            try {
                setHistoryLoading(true)
                const data = await api.getStock(ticker)

                setStockHistory(data)
            } catch (err) {
                console.error('Error fetching stock history:', err)
            } finally {
                setHistoryLoading(false)
            }
        }

        fetchStockHistory()
    }, [ticker])

    const isPositive = stockData?.costChange >= 0
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
    const formattedPrice = stockData?.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const formattedCostChange = stockData ? `${isPositive ? '+' : ''}${stockData.costChange.toFixed(2)}` : ''
    const formattedPercentChange = stockData ? `${isPositive ? '+' : ''}${stockData.percentageChange.toFixed(1)}%` : ''


    const latestHistory = stockHistory?.history?.[stockHistory.history.length - 1]

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
                        isLoading={historyLoading}
                    >
                        {stockData && latestHistory ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
                                {/* Stock name/ticker */}
                                <div>
                                    <h3 className="text-3xl font-bold text-[#07407b]">{stockData.name}</h3>
                                    <p className="text-gray-500 text-xl mt-2">{ticker}</p>
                                </div>

                                {/* Current Price */}
                                <div>
                                    <p className="text-gray-600 mb-2">Current Price</p>
                                    <p className="text-5xl font-bold text-gray-900">${formattedPrice}</p>
                                </div>

                                {/* Change ($) */}
                                <div>
                                    <p className="text-gray-600 mb-1">Change ($)</p>
                                    <p className={`text-2xl font-semibold ${changeColor}`}>{formattedCostChange}</p>
                                </div>

                                {/* Change (%) */}
                                <div>
                                    <p className="text-gray-600 mb-1">Change (%)</p>
                                    <p className={`text-2xl font-semibold ${changeColor}`}>{formattedPercentChange}</p>
                                </div>

                                {/* Border separator spans both columns */}
                                <div className="border-t pt-4 col-span-2">
                                    <p className="text-gray-600  font-semibold">Latest Trading Data</p>
                                </div>

                                {/* Date */}
                                <div>
                                    <p className="text-gray-500 text-base">Date</p>
                                    <p className="text-xl font-medium">{latestHistory.Date}</p>
                                </div>

                                {/* Volume */}
                                <div>
                                    <p className="text-gray-500 text-base">Volume</p>
                                    <p className="text-xl font-medium">{latestHistory.Volume.toLocaleString()}</p>
                                </div>

                                {/* Open */}
                                <div>
                                    <p className="text-gray-500 text-base">Open</p>
                                    <p className="text-xl font-medium">${latestHistory.Open.toFixed(2)}</p>
                                </div>

                                {/* High */}
                                <div>
                                    <p className="text-gray-500 text-base">High</p>
                                    <p className="text-xl font-medium text-green-600">${latestHistory.High.toFixed(2)}</p>
                                </div>

                                {/* Low */}
                                <div>
                                    <p className="text-gray-500 text-base">Low</p>
                                    <p className="text-xl font-medium text-red-600">${latestHistory.Low.toFixed(2)}</p>
                                </div>

                                {/* Close */}
                                <div>
                                    <p className="text-gray-500 text-base">Close</p>
                                    <p className="text-xl font-medium">${latestHistory.Close.toFixed(2)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Loading stock data...</p>
                        )}
                    </Panel>

                    <StockGraph ticker={ticker} change={stockData.costChange}></StockGraph>

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