import Panel from "./Panel.jsx";
import {useEffect, useState} from "react";
import {getMarketData} from "../services/moduleOverviewCache.js";




export default function MarketOverviewPanel({isExpanded, isCollapsed, onExpand, onCollapse}) {
    const [marketData, setMarketData] = useState(null);
    const [bottomLoading, setBottomLoading] = useState(true)



    useEffect(() => {
        getMarketData().then(data => {
            console.log(data);
            setMarketData(data);
            setBottomLoading(false);
        })
            .catch(err => {
                console.error(err);
                setBottomLoading(false);
            });
    }, []);


    const getSentimentColor = (sentiment) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'bg-green-100 text-green-800 border-green-200';
            case 'negative': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    return <Panel
    title="AI Market Overview"
    isExpanded={isExpanded}
    isCollapsed={isCollapsed}
    onExpand={onExpand}
    onCollapse={onCollapse}
    isLoading={bottomLoading}
>
    {marketData ? (
        <div className="flex flex-col flex-1 justify-between h-full">

            {/* 1. Portfolio Overview Section */}
            <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Market Overview
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getSentimentColor(marketData.sentiment)}`}>
                                    {marketData.sentiment}
                                </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                    {marketData.summary}
                </p>
                <div className="flex justify-end">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                            {marketData.sources.length} sources analyzed
                                        </span>
                </div>
            </div>

            {/* 3. Footer Disclaimer */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 italic text-center">
                    {marketData.disclaimer}
                </p>
            </div>
        </div>
    ) : (
        !bottomLoading && <p className="p-4 text-gray-500">No portfolio analysis available.</p>
    )}

</Panel>

}