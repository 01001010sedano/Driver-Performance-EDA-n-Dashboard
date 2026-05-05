"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { WeeklyRow, TopDriver, DriverRow } from "@/lib/types";
import KPICards from "@/components/KPICards";
import WeeklyChart from "@/components/WeeklyChart";
import TopDriversChart from "@/components/TopDriversChart";
import FilterBar from "@/components/FilterBar";
import DriverDetailModal from "@/components/DriverDetailModal";

export default function DashboardPage() {
  const [start, setStart]               = useState("2025-01-01");
  const [end, setEnd]                   = useState("2025-03-31");
  const [metric, setMetric]             = useState<"violations" | "accidents" | "delays">("violations");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [modalDriver, setModalDriver]   = useState<string | null>(null);

  // Fetch driver list once
  const { data: driversRes } = useSWR("drivers", () => api.drivers(), { revalidateOnFocus: false });
  const drivers: DriverRow[] = driversRes?.data ?? [];

  // Weekly summary
  const { data: weeklyRes, isLoading: weeklyLoading } = useSWR(
    ["weekly", start, end],
    () => api.weekly(start, end),
    { revalidateOnFocus: false }
  );
  const weeklyData: WeeklyRow[] = weeklyRes?.data ?? [];

  // Top drivers
  const { data: topRes, isLoading: topLoading } = useSWR(
    ["top-drivers", metric, start, end],
    () => api.topDrivers(metric, 10, start, end),
    { revalidateOnFocus: false }
  );
  const topDrivers: TopDriver[] = topRes?.data ?? [];

  // When a driver is selected in filter, open detail modal
  useEffect(() => {
    if (selectedDriver) setModalDriver(selectedDriver);
  }, [selectedDriver]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Performance Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Week 3 · Lamina Studios · EDA & Analytics</p>
        </div>

        {/* Filters */}
        <FilterBar
          start={start}
          end={end}
          selectedDriver={selectedDriver}
          metric={metric}
          drivers={drivers}
          onStartChange={setStart}
          onEndChange={setEnd}
          onDriverChange={setSelectedDriver}
          onMetricChange={setMetric}
        />

        {/* KPI Cards */}
        <KPICards data={weeklyData} loading={weeklyLoading} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyChart data={weeklyData} loading={weeklyLoading} />
          <TopDriversChart data={topDrivers} metric={metric} loading={topLoading} />
        </div>

        {/* Driver table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            All Drivers — click to view detail
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="pb-2 pr-4">Driver</th>
                  <th className="pb-2 pr-4">Avg Rating</th>
                  <th className="pb-2 pr-4">Total Accidents</th>
                  <th className="pb-2">Total Violations</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr
                    key={d.driver_id}
                    onClick={() => setModalDriver(d.driver_id)}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-4 font-semibold text-blue-600">{d.driver_id}</td>
                    <td className="py-2 pr-4">{d.avg_rating}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.total_accidents > 5
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {d.total_accidents}
                      </span>
                    </td>
                    <td className="py-2">{d.total_violations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-300 text-center pb-4">
          Data cached via Redis (TTL 300s) · Backend: Laravel 10 + PostgreSQL 16
        </p>
      </div>

      {/* Driver detail modal */}
      {modalDriver && (
        <DriverDetailModal
          driverId={modalDriver}
          start={start}
          end={end}
          onClose={() => { setModalDriver(null); setSelectedDriver(""); }}
        />
      )}
    </main>
  );
}
