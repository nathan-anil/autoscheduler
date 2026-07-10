export const SCHEDULE_START = 7 * 60;
export const SCHEDULE_END = 23 * 60;
export const SCHEDULE_TOTAL = SCHEDULE_END - SCHEDULE_START;

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const hourLabels = [
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
];

export const timeOptions = Array.from({ length: 33 }, (_, i) =>
  formatTime12h(i * 30),
);

export function formatTime12h(offsetMinutes: number) {
  const total = SCHEDULE_START + offsetMinutes;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start: number, end: number) {
  const fmt = (mins: number) => {
    const total = SCHEDULE_START + mins;
    const h24 = Math.floor(total / 60);
    const m = total % 60;
    const h12 = h24 % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")}`;
  };

  return `${fmt(start)} - ${fmt(end)}`;
}

export function formatPreviewRange(day: number, start: number, end: number) {
  return `${dayNames[day]}, ${formatTime12h(start)} – ${formatTime12h(end)}`;
}

export function timeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  let totalMinutes = hour * 60 + minute;
  if (period === "AM" && hour === 0) totalMinutes = 24 * 60;

  return totalMinutes - SCHEDULE_START;
}

export function blockPosition(start: number, end: number) {
  return {
    top: `${(start / SCHEDULE_TOTAL) * 100}%`,
    height: `${((end - start) / SCHEDULE_TOTAL) * 100}%`,
  };
}

export function formatWeekRange(weekOffset: number) {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + diff + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (weekOffset === 0) return "This week";
  return `${fmt(monday)} – ${fmt(sunday)}`;
}
