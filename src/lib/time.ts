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

/** Parse a 12h time like "9:00 AM" into minutes after 7:00 AM. Returns null if invalid. */
export function timeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

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

export function mondayOfWeek(weekOffset: number) {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function formatWeekRange(weekOffset: number) {
  const monday = mondayOfWeek(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (weekOffset === 0) return "This week";
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/** Day header label with calendar date for the selected week offset. */
export function formatDayHeader(dayIndex: number, weekOffset: number) {
  const date = new Date(mondayOfWeek(weekOffset));
  date.setDate(date.getDate() + dayIndex);
  const dayNum = date.getDate();
  return `${days[dayIndex]} ${dayNum}`;
}
