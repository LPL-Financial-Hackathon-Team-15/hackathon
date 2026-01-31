// components/PinnedStocks.jsx
import {useEffect, useState} from 'react'
import StockCard from './StockCard.jsx'
import {api} from "../services/api.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function PinnedStocks() {
    const [pinnedStocks, setPinnedStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        stockIndex: null,
        stock: null
    })

    useEffect(() => {
        const fetchPinnedStocks = async () => {
            try {
                setLoading(true)
                const data = await api.getPinned()
                setPinnedStocks(data)
            } catch (err) {
                console.error('Error fetching pinned stocks:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchPinnedStocks()
    }, [])

    const handleDelete = (index) => {
        const stock = pinnedStocks[index]
        setConfirmDialog({
            isOpen: true,
            stockIndex: index,
            stock: stock
        })
    }

    const confirmDelete = async () => {
        const { stockIndex, stock } = confirmDialog

        try {
            // Remove from database
            await api.removePinned(stock.ticker)

            // Update local state
            setPinnedStocks(pinnedStocks.filter((_, i) => i !== stockIndex))

            // Close dialog
            setConfirmDialog({ isOpen: false, stockIndex: null, stock: null })
        } catch (err) {
            console.error('Error removing pinned stock:', err)
            alert('Failed to remove stock. Please try again.')
            setConfirmDialog({ isOpen: false, stockIndex: null, stock: null })
        }
    }

    const cancelDelete = () => {
        setConfirmDialog({ isOpen: false, stockIndex: null, stock: null })
    }



    if (loading) {
        return (
            <div className="h-[calc(90vh-5rem)] w-1/2 rounded-2xl bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <h2 className="text-xl  font-bold text-[#07407b]">Pinned Stocks</h2>
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
                    <h2 className="text-xl font-bold text-[#07407b]">Pinned Stocks</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-600">Error loading stocks: {error}</div>
                </div>
            </div>
        )
    }

    return (
        <>
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
    <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove Pinned Stock"
        message={confirmDialog.stock
            ? `Are you sure you want to remove ${confirmDialog.stock.ticker} (${confirmDialog.stock.name}) from your pinned stocks?`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
    />
    </>
    )
}