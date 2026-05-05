import axios from "axios";

const BASE = "/api/proxy";

export const api = {
  weekly: (start: string, end: string) =>
    axios.get(`${BASE}/metrics/weekly?start=${start}&end=${end}`).then((r) => r.data),

  topDrivers: (metric = "violations", limit = 10, start: string, end: string) =>
    axios
      .get(`${BASE}/metrics/top-drivers?metric=${metric}&limit=${limit}&start=${start}&end=${end}`)
      .then((r) => r.data),

  interventions: (threshold = 2, start: string, end: string) =>
    axios
      .get(`${BASE}/metrics/interventions?threshold=${threshold}&start=${start}&end=${end}`)
      .then((r) => r.data),

  driverDetail: (driverId: string, start: string, end: string) =>
    axios
      .get(`${BASE}/metrics/driver/${driverId}?start=${start}&end=${end}`)
      .then((r) => r.data),

  drivers: () => axios.get(`${BASE}/drivers`).then((r) => r.data),
};
