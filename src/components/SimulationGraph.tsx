import React, { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Counts } from '../types';

Chart.register(...registerables);

interface SimulationGraphProps {
  data: { timestamp: number; counts: Counts }[];
  onExportData: () => void;
}

const SimulationGraph: React.FC<SimulationGraphProps> = ({ data, onExportData }) => {
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const datasets = [
      {
        label: 'Rock',
        data: data.map(d => d.counts.rock),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Paper',
        data: data.map(d => d.counts.paper),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'Scissors',
        data: data.map(d => d.counts.scissors),
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
      },
    ];

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 50,
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="w-full max-w-[800px] bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Population Over Time</h2>
        <button
          onClick={onExportData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Export CSV
        </button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default SimulationGraph; 