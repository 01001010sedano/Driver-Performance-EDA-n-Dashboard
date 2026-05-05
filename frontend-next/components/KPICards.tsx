"use client";

import { WeeklyRow } from "@/lib/types";

interface Props {
  data: WeeklyRow[];
  loading: boolean;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold text-gray-800">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function KPICards({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-24 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  const totalDelays     = data.reduce((s, r) => s + Number(r.total_delays), 0);
  const totalAccidents  = data.reduce((s, r) => s + Number(r.total_accidents), 0);
  const totalViolations = data.reduce((s, r) => s + Number(r.total_violations), 0);
  const avgRating       = data.length
    ? (data.reduce((s, r) => s + Number(r.avg_rating), 0) / data.length).toFixed(2)
    : "—";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Total Delays"      value={totalDelays.toLocaleString()}     sub="minutes (period)" />
      <Card label="Total Accidents"   value={totalAccidents.toLocaleString()}  sub="reported incidents" />
      <Card label="Total Violations"  value={totalViolations.toLocaleString()} sub="traffic violations" />
      <Card label="Avg Rating"        value={String(avgRating)}                sub="out of 5.0" />
    </div>
  );
}
