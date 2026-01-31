// components/RightPanel.jsx - update to pass isCollapsed prop
import { useState, useEffect } from 'react'
import Panel from './Panel.jsx'

export default function HomeRightPanels() {
    const [topExpanded, setTopExpanded] = useState(false)
    const [bottomExpanded, setBottomExpanded] = useState(false)
    const [topLoading, setTopLoading] = useState(true)
    const [bottomLoading, setBottomLoading] = useState(true)

    const [portfolioData, setPortfolioData] = useState(null);

    useEffect(() => {
    // Hardcoded user_id 'investor_01'
    const userId = 'investor_01';
    
    setBottomLoading(true);
    
    fetch(`http://ec2-3-142-36-77.us-east-2.compute.amazonaws.com:8000/pinned/overview/${userId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch portfolio analysis');
            return res.json();
        })
        .then(data => {
            setPortfolioData(data);
            setBottomLoading(false);
        })
        .catch(err => {
            console.error(err);
            setBottomLoading(false);
        });
    }, []);

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

    // Helper for sentiment colors
    const getSentimentColor = (sentiment) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'bg-green-100 text-green-800 border-green-200';
            case 'negative': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    return (
        <div className="h-[calc(90vh-5rem)] w-1/2 m-4 flex flex-col gap-4">
            <Panel
                title="AI Stock Analysis"
                isExpanded={topExpanded}
                isCollapsed={bottomExpanded}
                onExpand={handleTopExpand}
                onCollapse={handleCollapse}
                isLoading={bottomLoading} // Using the local loading state we created
            >
                {portfolioData ? (
                    <div className="flex flex-col h-full overflow-y-auto">
                        
                        {/* 1. Portfolio Overview Section */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                    Portfolio Overview
                                </h3>
                                <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getSentimentColor(portfolioData.sentiment)}`}>
                                    {portfolioData.sentiment}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {portfolioData.overview}
                            </p>
                        </div>

                        {/* 2. Individual Stock Summaries */}
                        <div className="flex flex-col gap-4">
                            {portfolioData.individual_summaries.map((stock) => (
                                <div key={stock.ticker} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-bold text-blue-600">{stock.ticker}</span>
                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">{stock.name}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSentimentColor(stock.sentiment)}`}>
                                            {stock.sentiment}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-2">
                                        {stock.summary}
                                    </p>
                                    
                                    {/* Source count pill */}
                                    <div className="flex justify-end">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                            {stock.article_count} sources analyzed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 3. Footer Disclaimer */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-[10px] text-gray-400 italic text-center">
                                {portfolioData.disclaimer}
                            </p>
                        </div>
                    </div>
                ) : (
                    !bottomLoading && <p className="p-4 text-gray-500">No portfolio analysis available.</p>
                )}
            </Panel>
            <Panel
                title="AI Market Overview"
                isExpanded={bottomExpanded}
                isCollapsed={topExpanded}
                onExpand={handleBottomExpand}
                onCollapse={handleCollapse}
                isLoading={bottomLoading}
            />
        </div>
    )
}