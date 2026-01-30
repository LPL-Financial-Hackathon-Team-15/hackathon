import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          React + Tailwind
        </h1>
        <p className="text-gray-600 mb-6">
          Your frontend is ready to go! Start building amazing things.
        </p>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
          <p className="text-lg text-gray-700 mb-4">Count: {count}</p>
          <button
            onClick={() => setCount(count + 1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Increment
          </button>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ React is working</p>
          <p>✅ Tailwind CSS is working</p>
          <p>✅ Vite dev server is ready</p>
        </div>
      </div>
    </div>
  )
}

export default App
