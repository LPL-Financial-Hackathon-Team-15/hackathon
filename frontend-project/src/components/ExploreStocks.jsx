// components/ExploreStocks.jsx
import {useEffect, useState} from 'react'
import StockCard from './StockCard'
import {api} from "../services/api.js";

export default function ExploreStocks({ searchResults }) {
    const [stocks, setStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchAllStocks = async () => {
            try {
                setLoading(true)
                const data = await api.getAllStocks()
                setStocks(data)
            } catch (err) {
                console.error('Error fetching stocks:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchAllStocks()
    }, [])

    const handleDelete = (index) => {
        setStocks(stocks.filter((_, i) => i !== index))
    }

    const handlePin = (index) => {
        console.log('Pinned stock at index:', index)
        // Add pin logic here
    }

    if (loading) {
        return (
            <div className="h-[calc(90vh-5rem)] w-1/2 rounded-2xl bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <h2 className="text-xl  font-bold text-[#07407b]">Explore Stocks</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-16 h-16">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#07407b] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-[calc(90vh-5rem)] w-1/2 rounded-2xl bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-[#07407b]">Explore Stocks</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-600">Error loading stocks: {error}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(90vh-5rem)] w-1/2 bg-gray-50 border-r border-gray-200 rounded-2xl m-4 flex flex-col">
            {/* Header - Fixed */}
            <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                <h2 className="text-xl font-bold text-[#07407b]">Explore Stocks</h2>
            </div>

            {/* Stock Cards - Scrollable */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${searchResults.length <= 3 ? 'flex flex-col justify-center' : 'space-y-3'}`}>
                {searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-lg font-medium">No stocks yet</p>
                        <p className="text-sm mt-1">The market probably exploded or something idek</p>
                    </div>
                ) : (
                    searchResults.map((stock, index) => (
                        <StockCard
                            key={index}
                            ticker={stock.ticker}
                            name={stock.name}
                            currentPrice={stock.currentPrice}
                            costChange={stock.costChange}
                            percentageChange={stock.percentageChange}
                            onPin={() => handlePin(index)}
                            onDelete={() => handleDelete(index)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}