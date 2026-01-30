// components/ExplorePanel.jsx
import { useState } from 'react'
import Panel from './Panel.jsx'
import SearchBar from './SearchBar'

export default function ExploreRightPanels({ onSearch }) {
    const [topExpanded, setTopExpanded] = useState(false)
    const [bottomExpanded, setBottomExpanded] = useState(false)
    const [topLoading, setTopLoading] = useState(false)
    const [bottomLoading, setBottomLoading] = useState(false)

    const handleTopExpand = () => {
        setTopExpanded(true)
        setBottomExpanded(false)
    }

    const handleBottomExpand = () => {
        setBottomExpanded(true)
        setTopExpanded(false)
    }

    const handleCollapse = () => {
        setTopExpanded(false)
        setBottomExpanded(false)
    }

    return (
        <div className="h-[calc(90vh-5rem)] m-4 flex flex-col gap-4 flex-1">
            {/* Search Bar */}


            {/* Data Panels */}
            <div className="flex-1 flex flex-col gap-4">
                <SearchBar onSearch={onSearch} />
                <Panel
                    title="Financial News"
                    isExpanded={topExpanded}
                    isCollapsed={bottomExpanded}
                    onExpand={handleTopExpand}
                    onCollapse={handleCollapse}
                    isLoading={topLoading}
                />
                <Panel
                    title="AI Market Overview"
                    isExpanded={bottomExpanded}
                    isCollapsed={topExpanded}
                    onExpand={handleBottomExpand}
                    onCollapse={handleCollapse}
                    isLoading={bottomLoading}
                />
            </div>
        </div>
    )
}