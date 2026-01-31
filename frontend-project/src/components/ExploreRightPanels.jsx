// components/ExplorePanel.jsx
import { useState, useEffect } from 'react'
import Panel from './Panel.jsx'
import SearchBar from './SearchBar'
import MarketOverviewPanel from "./MarketOverviewPanel.jsx";

export default function ExploreRightPanels({ onSearch }) {
    const [topExpanded, setTopExpanded] = useState(false)
    const [bottomExpanded, setBottomExpanded] = useState(false)
    const [topLoading, setTopLoading] = useState(false)
    const [bottomLoading, setBottomLoading] = useState(false)

    const [newsArticles, setNewsArticles] = useState([])

    useEffect(() => {
        setTopLoading(true)
        fetch('http://ec2-3-142-36-77.us-east-2.compute.amazonaws.com:8000/news/category/general?days=7')
            .then(res => res.json())
            .then(data => {
                setNewsArticles(data.articles || [])
                setTopLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch news:', err)
                setTopLoading(false)
            })
    }, [])

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
                title="Financial News"
                isExpanded={topExpanded}
                isCollapsed={bottomExpanded}
                onExpand={handleTopExpand}
                onCollapse={handleCollapse}
                isLoading={topLoading}
            >
                {newsArticles.length ? (
                    <div className="flex flex-col gap-2">
                        {newsArticles.map((article, idx) => (
                            <div key={idx} className="p-2 border-b border-gray-200 last:border-b-0">
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    {article.title}
                                </a>
                                <p className="text-sm mt-1 text-gray-700">{article.summary}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="p-2 text-sm text-gray-500">No news available</p>
                )}
            </Panel>
            <MarketOverviewPanel
                isExpanded={bottomExpanded}
                isCollapsed={topExpanded}
                onExpand={handleBottomExpand}
                onCollapse={handleCollapse}
            />
        </div>
    )
}