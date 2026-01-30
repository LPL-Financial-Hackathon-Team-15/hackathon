// components/LoadingSpinner.jsx
export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-[#07407b] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    )
}