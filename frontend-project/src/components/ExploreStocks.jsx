// components/ExploreStocks.jsx - update header to include filter button
import { useEffect, useState } from 'react'
import StockCard from './StockCard'
import SearchBar from './SearchBar'
import FilterPanel from './FilterPanel'
import { api } from "../services/api.js"

export default function ExploreStocks({ searchResults, setSearchResults, allStocks, setAllStocks, onSearch }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
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
    const [pinnedTickers, setPinnedTickers] = useState(new Set())
    const [pinningTicker, setPinningTicker] = useState(null) // Track which stock is being pinned
    const [pinError, setPinError] = useState(null) // Track pin errors

    useEffect(() => {
        const fetchAllStocks = async () => {
            try {
                setLoading(true)
                const data = await api.getAllStocks()
                setAllStocks(data)
                setSearchResults(data)
            } catch (err) {
                console.error('Error fetching stocks:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchAllStocks()
    }, [])

    const handlePin = async (ticker) => {
        try {
            setPinningTicker(ticker) // Show loading state
            setPinError(null) // Clear any previous errors

            // Pin the stock via API
            await api.addPinned(ticker)

            // Immediately remove from explore view
            const updatedAllStocks = allStocks.filter(stock => stock.ticker !== ticker)
            const updatedSearchResults = searchResults.filter(stock => stock.ticker !== ticker)

            setAllStocks(updatedAllStocks)
            setSearchResults(updatedSearchResults)

            // Update pinned tickers set
            setPinnedTickers(prev => new Set(prev).add(ticker))
        } catch (err) {
            console.error('Error pinning stock:', err)
            setPinError(ticker) // Mark this ticker as having an error

            // Clear error after 3 seconds
            setTimeout(() => setPinError(null), 3000)
        } finally {
            setPinningTicker(null) // Clear loading state
        }
    }

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters)
        applyFilters(searchResults, newFilters)
    }

    const applyFilters = (stocks, filterSettings) => {
        // Start with allStocks instead of current searchResults when resetting
        let filtered = filterSettings.sortBy === 'none' &&
        filterSettings.minPrice === '' &&
        filterSettings.maxPrice === '' &&
        filterSettings.minChange === '' &&
        filterSettings.maxChange === '' &&
        filterSettings.minPercentChange === '' &&
        filterSettings.maxPercentChange === ''
            ? [...allStocks]
            : [...stocks]
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

        setSearchResults(filtered)
    }

    if (loading) {
        return (
            <div className="h-[calc(90vh-5rem)] w-1/2 rounded-2xl bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-[#07407b] whitespace-nowrap">Explore Stocks</h2>
                        <div className="flex-1">
                            <SearchBar onSearch={onSearch} />
                        </div>
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
            <div className="h-[calc(90vh-5rem)] w-1/2 rounded-2xl bg-gray-50 border-r border-gray-200 m-4 flex flex-col">
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-[#07407b] whitespace-nowrap">Explore Stocks</h2>
                        <div className="flex-1">
                            <SearchBar onSearch={onSearch} />
                        </div>
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
            <div className="h-[calc(90vh-5rem)] overflow-hidden w-1/2 bg-gray-50 border-r border-gray-200 rounded-2xl m-4 flex flex-col">
                {/* Header - Fixed with Title, Search Bar, and Filter Button */}
                <div className="bg-gray-50 border-b rounded-t-2xl border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-[#07407b] whitespace-nowrap">Explore Stocks</h2>
                        <div className="flex items-center gap-2 w-1/2"> {/* Changed from flex-1 to fixed width */}
                                <SearchBar onSearch={onSearch} />
                            <button
                                onClick={() => setFilterPanelOpen(true)}
                                className="text-gray-400 hover:text-[#07407b] transition-colors p-2 flex-shrink-0"
                                title="Filter & Sort"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stock Cards - Scrollable */}
                <div className="flex-1 overflow-y-scroll p-4 custom-scrollbar space-y-3">
                    {searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-lg font-medium">No stocks found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or search</p>
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
                                isLoading={pinningTicker === stock.ticker}
                                hasError={pinError === stock.ticker}
                                onPin={() => handlePin(stock.ticker)}
                                onDelete={null}
                            />
                        ))
                    )}
                </div>
            </div>

            <FilterPanel
                isOpen={filterPanelOpen}
                onClose={() => setFilterPanelOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
            />
        </>
    )
}