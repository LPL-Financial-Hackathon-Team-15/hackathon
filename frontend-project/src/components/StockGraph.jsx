import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';

export const StockGraph = ({ ticker }) => {
    const [chartData, setChartData] = useState([]);
    const [activeTimeframe, setActiveTimeframe] = useState({ 
        label: '1M', 
        period: '1mo', 
        interval: '1d' 
    });
    const [loading, setLoading] = useState(false);

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
            height: 350,
            zoom: { autoScaleYaxis: true },
            toolbar: { show: false },
            foreColor: '#94a3b8' // Slate-400 (matches modern dark themes)
        },
        dataLabels: { enabled: false },
        markers: { size: 0 },
        title: {
            text: `${ticker} Price History`,
            align: 'left',
            style: { color: '#f8fafc', fontSize: '20px' }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 90, 100]
            }
        },
        xaxis: { type: 'datetime' },
        yaxis: {
            labels: {
                formatter: (val) => `$${val.toFixed(2)}`
            }
        },
        colors: ['#3b82f6'], // Blue-500
        grid: { borderColor: '#334155' }, // Slate-700
        tooltip: {
            theme: 'dark',
            x: { format: 'dd MMM yyyy HH:mm' } 
        }
        
    };

    if (!ticker) return <div className="p-10 text-slate-400">Select a stock to view insights.</div>;

    return (
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{ticker}</h2>
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
                <div className="h-[350px] flex items-center justify-center text-blue-500">
                    Loading chart...
                </div>
            ) : (
                <Chart 
                    options={chartOptions} 
                    series={[{ name: 'Price', data: chartData }]} 
                    type="area" 
                    height={350} 
                />
            )}
        </div>
    );
};