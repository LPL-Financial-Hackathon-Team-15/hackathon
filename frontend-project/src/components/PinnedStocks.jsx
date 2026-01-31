// components/PinnedStocks.jsx - add filters
import { useState, useEffect } from 'react'
import StockCard from './StockCard'
import ConfirmDialog from './ConfirmDialog'
import FilterPanel from './FilterPanel'
import { api } from '../services/api'

export default function PinnedStocks() {
    const [pinnedStocks, setPinnedStocks] = useState([])
    const [allPinnedStocks, setAllPinnedStocks] = useState([]) // Store unfiltered stocks
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        stockIndex: null,
        stock: null
    })
    const [filterPanelOpen, setFilterPanelOpen] = useState(false)
    const [filters, setFilters] = useState({
        sortBy: 'none',
        sortOrder: 'asc',
        minPrice: '',
        maxPrice: '',
        minChange: '',
        maxChange: '',
        minPercentChange: '',
        maxPercentChange: ''
    })

    useEffect(() => {
        fetchPinnedStocks()
    }, [])

    const fetchPinnedStocks = async () => {
        try {
            setLoading(true)
            const data = await api.getPinned()
            setAllPinnedStocks(data)
            setPinnedStocks(data)
        } catch (err) {
            console.error('Error fetching pinned stocks:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

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
            await api.removePinned(stock.ticker)

            // Update both filtered and all stocks
            const newAllStocks = allPinnedStocks.filter(s => s.ticker !== stock.ticker)
            setAllPinnedStocks(newAllStocks)
            setPinnedStocks(pinnedStocks.filter((_, i) => i !== stockIndex))

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

    const handlePin = (index) => {
        console.log('Pinned stock at index:', index)
    }

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters)
        applyFilters(newFilters)
    }

    const applyFilters = (filterSettings) => {
        // Start with all pinned stocks if filters are reset
        let filtered = filterSettings.sortBy === 'none' &&
        filterSettings.minPrice === '' &&
        filterSettings.maxPrice === '' &&
        filterSettings.minChange === '' &&
        filterSettings.maxChange === '' &&
        filterSettings.minPercentChange === '' &&
        filterSettings.maxPercentChange === ''
            ? [...allPinnedStocks]
            : [...allPinnedStocks]

        // Apply price range filter
        if (filterSettings.minPrice !== '') {
            filtered = filtered.filter(stock => stock.currentPrice >= parseFloat(filterSettings.minPrice))
        }
        if (filterSettings.maxPrice !== '') {
            filtered = filtered.filter(stock => stock.currentPrice <= parseFloat(filterSettings.maxPrice))
        }

        // Apply cost change filter
        if (filterSettings.minChange !== '') {
            filtered = filtered.filter(stock => stock.costChange >= parseFloat(filterSettings.minChange))
        }
        if (filterSettings.maxChange !== '') {
            filtered = filtered.filter(stock => stock.costChange <= parseFloat(filterSettings.maxChange))
        }

        // Apply percentage change filter
        if (filterSettings.minPercentChange !== '') {
            filtered = filtered.filter(stock => stock.percentageChange >= parseFloat(filterSettings.minPercentChange))
        }
        if (filterSettings.maxPercentChange !== '') {
            filtered = filtered.filter(stock => stock.percentageChange <= parseFloat(filterSettings.maxPercentChange))
        }

        // Apply sorting
        if (filterSettings.sortBy !== 'none') {
            filtered.sort((a, b) => {
                const aVal = a[filterSettings.sortBy]
                const bVal = b[filterSettings.sortBy]

                if (typeof aVal === 'string') {
                    return filterSettings.sortOrder === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal)
                } else {
                    return filterSettings.sortOrder === 'asc'
                        ? aVal - bVal
                        : bVal - aVal
                }
            })
        }

        setPinnedStocks(filtered)
    }

    if (loading) {
        return (
            <div className="h-[calc(90vh-5rem)] rounded-2xl w-1/2 bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <div className="flex items-center  justify-between">
                        <h2 className="text-xl font-bold text-[#07407b]">Pinned Stocks</h2>
                        <button className="text-gray-400 hover:text-[#07407b] transition-colors p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </button>
                    </div>
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
            <div className="h-[calc(90vh-5rem)] rounded-2xl w-1/2 bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <div className="flex items-center  justify-between">
                        <h2 className="text-xl font-bold text-[#07407b]">Pinned Stocks</h2>
                        <button className="text-gray-400 hover:text-[#07407b] transition-colors p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-600">Error loading stocks: {error}</div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="h-[calc(90vh-5rem)] overflow-hidden rounded-2xl w-1/2 bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                {/* Header - Fixed with Filter Button */}
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#07407b]">Pinned Stocks</h2>
                        <button
                            onClick={() => setFilterPanelOpen(true)}
                            className="text-gray-400 hover:text-[#07407b] transition-colors p-2"
                            title="Filter & Sort"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stock Cards - Scrollable */}
                <div className={`flex-1 overflow-y-scroll p-4 custom-scrollbar ${pinnedStocks.length <= 3 ? 'flex flex-col justify-center' : 'space-y-3'}`}>
                    {pinnedStocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-lg font-medium">No pinned stocks yet</p>
                            <p className="text-sm mt-1">Search and pin stocks to track them here</p>
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
                                pinned                                onPin={() => handlePin(index)}
                                onDelete={() => handleDelete(index)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Confirm Dialog */}
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

            {/* Filter Panel */}
            <FilterPanel
                isOpen={filterPanelOpen}
                onClose={() => setFilterPanelOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
            />
        </>
    )
}