export interface WeeklyRow {
  week_start: string;
  total_delays: number;
  total_accidents: number;
  total_violations: number;
  avg_rating: number;
  active_drivers: number;
}

export interface TopDriver {
  driver_id: string;
  total_violations: number;
  total_accidents: number;
  avg_delay: number;
  avg_rating: number;
}

export interface DriverRow {
  driver_id: string;
  avg_rating: number;
  total_accidents: number;
  total_violations: number;
}

export interface DriverDetailRow {
  date: string;
  delays_minutes: number;
  violations_count: number;
  accidents_count: number;
  behavioral_problems: number;
  rating: number;
  shift: string;
}

export interface DriverDetailResponse {
  driver_id: string;
  start: string;
  end: string;
  summary: {
    avg_delay: number;
    total_violations: number;
    total_accidents: number;
    avg_rating: number;
  };
  data: DriverDetailRow[];
}

export interface DateRange {
  start: string;
  end: string;
}
