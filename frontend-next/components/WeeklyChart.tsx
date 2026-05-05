"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { WeeklyRow } from "@/lib/types";
import { format, parseISO } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  data: WeeklyRow[];
  loading: boolean;
}

export default function WeeklyChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-72 animate-pulse bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
        Loading chart…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-72 flex items-center justify-center text-gray-400 text-sm">
        No data for selected range.
      </div>
    );
  }

  const labels  = data.map((r) => format(parseISO(r.week_start), "MMM d"));
  const delays  = data.map((r) => Number(r.total_delays));
  const ratings = data.map((r) => Number(r.avg_rating));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Delays (min)",
        data: delays,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        yAxisID: "y1",
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: "Avg Rating",
        data: ratings,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.08)",
        yAxisID: "y2",
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ctx.dataset.label === "Avg Rating"
              ? `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`
              : `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y1: {
        type: "linear" as const,
        position: "left" as const,
        title: { display: true, text: "Total Delays (min)" },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y2: {
        type: "linear" as const,
        position: "right" as const,
        title: { display: true, text: "Avg Rating" },
        min: 1,
        max: 5,
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
        Weekly Trends — Delays & Rating
      </h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
