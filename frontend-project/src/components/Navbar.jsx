// components/Navbar.jsx - extract navbar into its own component
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
    const location = useLocation()
    const activeTab = location.pathname

    const isActive = (path) => {
        if (path === '/' && activeTab === '/') return true
        if (path !== '/' && activeTab.startsWith(path)) return true
        return false
    }

    return (
        <nav className="bg-[#07407b] text-white px-8 py-4 flex items-center justify-between max-h-[10vh]">
            <Link to="/" className="flex items-center">
                <img
                    src="/fairlogo.png"
                    alt="FAIR Logo"
                    className="h-full"
                />
            </Link>

            <div className="flex gap-6">
                <Link
                    to="/"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/')
                            ? 'bg-white text-[#07407b]'
                            : 'text-white hover:bg-[#0a5091]'
                    }`}
                >
                    My Stocks
                </Link>
                <Link
                    to="/explore"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/explore')
                            ? 'bg-white text-[#07407b]'
                            : 'text-white hover:bg-[#0a5091]'
                    }`}
                >
                    Explore
                </Link>
                <Link
                    to="/account"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive('/account')
                            ? 'bg-white text-[#07407b]'
                            : 'text-white hover:bg-[#0a5091]'
                    }`}
                >
                    Account Info
                </Link>
            </div>
        </nav>
    )
}