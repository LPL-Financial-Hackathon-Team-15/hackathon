// pages/ExplorePage.jsx
import { useState } from 'react'
import ExploreStocks from '../components/ExploreStocks'
import ExploreRightPanels from '../components/ExploreRightPanels'

export default function ExplorePage() {
    const [allStocks, setAllStocks] = useState([]) // Store all stocks
    const [filteredStocks, setFilteredStocks] = useState([]) // Store filtered results

    const handleSearch = (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') {
            // If search is empty, show all stocks
            setFilteredStocks(allStocks)
            return
        }

        const term = searchTerm.toLowerCase().trim()

        // Filter by ticker or name
        const filtered = allStocks.filter(stock =>
            stock.ticker.toLowerCase().includes(term) ||
            stock.name.toLowerCase().includes(term)
        )

        setFilteredStocks(filtered)
    }

    return (
        <div className="flex">
            <ExploreStocks
                searchResults={filteredStocks}
                setSearchResults={setFilteredStocks}
                allStocks={allStocks}
                setAllStocks={setAllStocks}
                onSearch={handleSearch}
            />
            <ExploreRightPanels />
        </div>
    )
}