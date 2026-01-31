// components/SearchBar.jsx - update to trigger on every keystroke
import { useState } from 'react'

export default function SearchBar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('')

    const handleChange = (e) => {
        const value = e.target.value
        setSearchTerm(value)
        onSearch(value) // Call onSearch on every keystroke
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Still handle submit if user presses Enter
        if (searchTerm.trim()) {
            onSearch(searchTerm)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleChange}
                    placeholder="Search stocks by ticker or company name..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07407b] focus:border-transparent"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#07407b] transition-colors p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>
        </form>
    )
}