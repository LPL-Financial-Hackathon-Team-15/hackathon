import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';

export const StockGraph = ({ ticker, change }) => {
    const [chartData, setChartData] = useState([]);
    const [activeTimeframe, setActiveTimeframe] = useState({
        label: '1M', 
        period: '1mo', 
        interval: '1d' 
    });
    const [loading, setLoading] = useState(false);
    const [chartColor, setChartColor] = useState("#07407b")

    const timeframes = [
        { label: '1D', period: '1d', interval: "5m" },
        { label: '1W', period: '5d', interval: "15m" },
        { label: '1M', period: '1mo', interval: "1d" },
        { label: '1Y', period: '1y', interval: "1d" },
        { label: '5Y', period: '5y', interval: "5d" },
        { label: 'MAX', period: 'max', interval: "1mo" },
    ];

    useEffect(() => {
        const fetchStockData = async () => {
            if (!ticker) return;
            setLoading(true);
            try {
                const response = await axios.get(
                    `http://ec2-3-142-36-77.us-east-2.compute.amazonaws.com:8000/stock/${ticker}`, 
                    {
                        params: {
                            period: activeTimeframe.period,
                            interval: activeTimeframe.interval
                        }
                    }
                );
                
                // Transform FastAPI data for ApexCharts Area Chart
                const formattedData = response.data.history.map(item => [
                    new Date(item.Date).getTime(), 
                    item.Close
                ]);

                if (formattedData.length > 0) {
                    const startPrice = formattedData[0][1];
                    const endPrice = formattedData[formattedData.length-1][1];

                    const isPositive = endPrice >= startPrice;
                    setChartColor(isPositive ? '#16a34a' : '#dc2626');
                }

                setChartData(formattedData);
            } catch (error) {
                console.error("Error fetching chart data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
    }, [ticker, activeTimeframe]);



    const chartOptions = {
        chart: {
            id: 'area-datetime',
            type: 'area',
            zoom: { autoScaleYaxis: true },
            toolbar: { show: false },
            foreColor: '#07407b' // Slate-400 (matches modern dark themes)
        },
        dataLabels: { enabled: false },
        markers: { size: 0 },
        fill: {
            type: 'gradient',
            gradient: {
                opacityFrom: 1,
                opacityTo: 0.5,
            }
        },
        xaxis: { type: 'datetime' },
        yaxis: {
            labels: {
                formatter: (val) => `$${val.toFixed(2)}`
            }
        },
        colors: [chartColor], // Blue-500
        grid: { borderColor: '#334155' }, // Slate-700
        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM yyyy HH:mm' } 
        }

    };

    if (!ticker) return <div className="p-10 text-slate-400">Select a stock to view insights.</div>;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col flex-1 w-full">
            <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-gray-200">

                    <h2 className="text-2xl font-bold text-[#07407b]">{ticker}</h2>
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                        {timeframes.map((tf) => (
                            <button
                                key={tf.label}
                                onClick={() => setActiveTimeframe(tf)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                                    activeTimeframe.label === tf.label
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

            </div>

            {loading ? (
                <div className="flex items-center justify-center text-blue-500">
                    Loading chart...
                </div>
            ) : (
                <div className="h-full">
                    <Chart
                        options={chartOptions}
                        series={[{ name: 'Price', data: chartData }]}
                        type="area"
                        height={"100%"}
                    />
                </div>
            )}
        </div>
    );
};