import PinnedStocks from "../components/PinnedStocks.jsx";
import {useState} from "react";
import HomeRightPanels from "../components/HomeRightPanels.jsx";

function Home() {


    return (

                <div className="flex">
                    <PinnedStocks />
                    <HomeRightPanels />
                </div>
    )
}

export default Home