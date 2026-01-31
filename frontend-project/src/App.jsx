import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import ClickedStock from "./pages/ClickedStock.jsx";
import {Route, Routes} from "react-router";
import Navbar from "./components/Navbar.jsx";

function App() {

  return (
      <div className="min-h-screen bg-[#07407b]">
        {/* Navbar */}
        <Navbar/>
          <main className="p-8 h-[90vh] bg-gradient-to-br from-[#07407b] via-[#0a5091] to-[#05325f]" >
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/stock/:ticker" element={<ClickedStock />} />
                  {/*<Route path="/account" element={<AccountInfoPage />} />*/}
              </Routes>
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

export default App
