"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { api } from "@/lib/api";
import { DriverDetailResponse } from "@/lib/types";
import { format, parseISO } from "date-fns";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend
);

interface Props {
  driverId: string;
  start: string;
  end: string;
  onClose: () => void;
}

export default function DriverDetailModal({ driverId, start, end, onClose }: Props) {
  const [detail, setDetail] = useState<DriverDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.driverDetail(driverId, start, end)
      .then((res) => { setDetail(res); setLoading(false); })
      .catch(() => { setError("Failed to load driver data."); setLoading(false); });
  }, [driverId, start, end]);

  const labels       = detail?.data.map((r) => format(parseISO(r.date), "MMM d")) ?? [];
  const ratings      = detail?.data.map((r) => r.rating) ?? [];
  const violations   = detail?.data.map((r) => r.violations_count) ?? [];
  const accidents    = detail?.data.map((r) => r.accidents_count) ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Driver Profile — <span className="text-blue-600">{driverId}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="h-40 flex items-center justify-center text-gray-400">Loading…</div>
        )}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {detail && !loading && (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Avg Delay",      value: `${detail.summary.avg_delay} min` },
                { label: "Avg Rating",     value: String(detail.summary.avg_rating) },
                { label: "Total Violations", value: String(detail.summary.total_violations) },
                { label: "Total Accidents",  value: String(detail.summary.total_accidents) },
              ].map((k) => (
                <div key={k.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">{k.label}</div>
                  <div className="text-xl font-bold text-gray-700">{k.value}</div>
                </div>
              ))}
            </div>

            {/* Rating trend */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Rating Trend</h3>
              <Line
                data={{
                  labels,
                  datasets: [{ label: "Rating", data: ratings, borderColor: "#10b981", tension: 0.3, pointRadius: 2 }],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { min: 1, max: 5 } },
                }}
              />
            </div>

            {/* Stacked bar: violations + accidents */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Violations & Accidents</h3>
              <Bar
                data={{
                  labels,
                  datasets: [
                    { label: "Violations", data: violations, backgroundColor: "#f59e0b", stack: "s" },
                    { label: "Accidents",  data: accidents,  backgroundColor: "#ef4444", stack: "s" },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true, grid: { color: "rgba(0,0,0,0.05)" } },
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
