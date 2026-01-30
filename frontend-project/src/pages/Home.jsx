import PinnedStocks from "../components/PinnedStocks.jsx";
import {useState} from "react";
import HomeRightPanels from "../components/HomeRightPanels.jsx";

function Home() {


    return (
        <main className="p-8 h-[90vh] bg-gradient-to-br from-[#07407b] via-[#0a5091] to-[#05325f]" >
                <div className="flex">
                    <PinnedStocks />
                    <HomeRightPanels />
                </div>
            </main>
    )
}

export default Home