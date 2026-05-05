"use client";

import { DriverRow } from "@/lib/types";

interface Props {
  start: string;
  end: string;
  selectedDriver: string;
  metric: "violations" | "accidents" | "delays";
  drivers: DriverRow[];
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onDriverChange: (v: string) => void;
  onMetricChange: (v: "violations" | "accidents" | "delays") => void;
}

export default function FilterBar({
  start, end, selectedDriver, metric, drivers,
  onStartChange, onEndChange, onDriverChange, onMetricChange,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
      {/* Date range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-400 uppercase">Start Date</label>
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-400 uppercase">End Date</label>
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Driver select */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-400 uppercase">Driver</label>
        <select
          value={selectedDriver}
          onChange={(e) => onDriverChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[140px]"
        >
          <option value="">All Drivers</option>
          {drivers.map((d) => (
            <option key={d.driver_id} value={d.driver_id}>
              {d.driver_id} — ★ {d.avg_rating}
            </option>
          ))}
        </select>
      </div>

      {/* Metric select for top drivers */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-400 uppercase">Top Drivers By</label>
        <select
          value={metric}
          onChange={(e) => onMetricChange(e.target.value as "violations" | "accidents" | "delays")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="violations">Violations</option>
          <option value="accidents">Accidents</option>
          <option value="delays">Delays</option>
        </select>
      </div>
    </div>
  );
}
