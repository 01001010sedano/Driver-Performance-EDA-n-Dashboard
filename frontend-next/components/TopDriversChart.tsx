"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { TopDriver } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  data: TopDriver[];
  metric: "violations" | "accidents" | "delays";
  loading: boolean;
}

const METRIC_CONFIG = {
  violations: { label: "Total Violations", key: "total_violations" as const, color: "#f59e0b" },
  accidents:  { label: "Total Accidents",  key: "total_accidents"  as const, color: "#ef4444" },
  delays:     { label: "Avg Delay (min)",  key: "avg_delay"        as const, color: "#8b5cf6" },
};

export default function TopDriversChart({ data, metric, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-72 animate-pulse bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
        Loading chart…
      </div>
    );
  }

  const cfg = METRIC_CONFIG[metric];

  const chartData = {
    labels: data.map((d) => d.driver_id),
    datasets: [
      {
        label: cfg.label,
        data: data.map((d) => Number(d[cfg.key])),
        backgroundColor: cfg.color,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.05)" } },
      y: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
        Top Drivers — {cfg.label}
      </h2>
      <Bar data={chartData} options={options} />
    </div>
  );
}
