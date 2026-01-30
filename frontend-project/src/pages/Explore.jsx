// pages/ExplorePage.jsx
import { useState } from 'react'
import ExploreStocks from '../components/ExploreStocks'
import ExploreRightPanels from '../components/ExploreRightPanels.jsx'

export default function ExplorePage() {
    const [searchResults, setSearchResults] = useState([])

    const handleSearch = (searchTerm) => {
        console.log('Searching for:', searchTerm)
        // Add your search API call here
        // For now, you can set dummy data:
        // setSearchResults([...])
    }

    return (
        <div className="flex">
            <ExploreStocks searchResults={searchResults} />
            <ExploreRightPanels onSearch={handleSearch} />
        </div>
    )
}