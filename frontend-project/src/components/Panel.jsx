// components/DataPanel.jsx
import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function Panel({ title, isExpanded, isCollapsed, onExpand, onCollapse, isLoading }) {
    const handleClick = () => {
        if (isExpanded) {
            onCollapse()
        } else {
            onExpand()
        }
    }

    return (
        <div
            className={`bg-white border border-gray-200 transition-all duration-300 rounded-2xl  ${
                isExpanded ? 'flex-[2]' : isCollapsed ? 'flex-none' : 'flex-1'
            }`}
        >
            {/* Header with expand/collapse button */}
            <div className={`flex items-center justify-between p-4 ${!isCollapsed && 'border-b border-gray-200'}`}>
                <h2 className="text-xl font-bold text-[#07407b]">{title}</h2>
                <button
                    onClick={handleClick}
                    className="text-gray-400 hover:text-[#07407b] transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                >
                    {isExpanded ? (
                        // Collapse icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    ) : (
                        // Expand icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Content area - hidden when collapsed */}
            {!isCollapsed && (
                <div className="p-4 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100% - 60px)' }}>
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <div>
                            {/* Your actual content will go here */}
                            <p className="text-gray-500">Content for {title}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}