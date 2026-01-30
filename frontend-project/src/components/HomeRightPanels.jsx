// components/RightPanel.jsx - update to pass isCollapsed prop
import { useState } from 'react'
import Panel from './Panel.jsx'

export default function HomeRightPanels() {
    const [topExpanded, setTopExpanded] = useState(false)
    const [bottomExpanded, setBottomExpanded] = useState(false)
    const [topLoading, setTopLoading] = useState(true)
    const [bottomLoading, setBottomLoading] = useState(true)

    // Simulate API calls (remove this in production)
    useState(() => {
        setTimeout(() => setTopLoading(false), 2000)
        setTimeout(() => setBottomLoading(false), 2500)
    })

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
        <div className="h-[calc(90vh-5rem)] w-1/2 m-4 flex flex-col gap-4">
            <Panel
                title="Stock Analysis"
                isExpanded={topExpanded}
                isCollapsed={bottomExpanded}
                onExpand={handleTopExpand}
                onCollapse={handleCollapse}
                isLoading={topLoading}
            />
            <Panel
                title="Market Trends"
                isExpanded={bottomExpanded}
                isCollapsed={topExpanded}
                onExpand={handleBottomExpand}
                onCollapse={handleCollapse}
                isLoading={bottomLoading}
            />
        </div>
    )
}