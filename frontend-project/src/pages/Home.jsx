import PinnedStocks from "../components/PinnedStocks.jsx";
import {useState} from "react";

function Home() {

    const [activeTab, setActiveTab] = useState('My Stocks')

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="h-[10vh] bg-[#07407b] text-white px-8 py-4 flex items-center justify-between">
                {/* Left side - NAME */}
                <div className="text-2xl font-bold">
                    FAIR
                </div>

                {/* Right side - Links */}
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('My Stocks')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'My Stocks'
                                ? 'bg-white text-[#07407b]'
                                : 'text-white hover:bg-[#0a5091]'
                        }`}
                    >
                        My Stocks
                    </button>
                    <button
                        onClick={() => setActiveTab('Explore')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'Explore'
                                ? 'bg-white text-[#07407b]'
                                : 'text-white hover:bg-[#0a5091]'
                        }`}
                    >
                        Explore
                    </button>
                    <button
                        onClick={() => setActiveTab('Account Info')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'Account Info'
                                ? 'bg-white text-[#07407b]'
                                : 'text-white hover:bg-[#0a5091]'
                        }`}
                    >
                        Account Info
                    </button>
                </div>
            </nav>

            {/* Main content area */}
            <main className="p-8 h-[90vh] bg-gradient-to-br from-[#07407b] via-[#0a5091] to-[#05325f]" >
                <div >
                    <PinnedStocks></PinnedStocks>
                </div>
            </main>

            <footer className="bg-[#07407b] py-6 text-center text-white text-sm">
                <p>© LPL Financial Hackathon Team 15 circa 2026</p>
                <p className="mt-1 text-xs ">
                    Note: No AI summaries are to be taken as financial advice.
                </p>
            </footer>
        </div>
    )
}

export default Home