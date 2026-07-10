import { activities } from "../activities";
import type { ActivityId, ScheduleBlock, SetupState } from "../types";
import { timeToMinutes } from "./time";

function uid() {
  return crypto.randomUUID();
}

function clashes(
  blocks: ScheduleBlock[],
  day: number,
  start: number,
  end: number,
) {
  return blocks.some(
    (b) =>
      b.day === day && b.start < end && start < b.end,
  );
}

function parseCount(value: string) {
  return Number.parseInt(value, 10) || 0;
}

function parseMins(value: string) {
  return Number.parseInt(value, 10) || 60;
}

function slotsFor(
  activityId: ActivityId,
  wake: number,
  sleep: number,
  duration: number,
) {
  const slots: { day: number; start: number }[] = [];
  const add = (day: number, hour: number, minute = 0) => {
    const start = (hour - 7) * 60 + minute;
    if (start >= wake && start + duration <= sleep) {
      slots.push({ day, start });
    }
  };

  if (activityId === "meals") {
    for (let d = 0; d < 7; d++) {
      add(d, 12);
      add(d, 19);
    }
    return slots;
  }

  if (activityId === "studying") {
    for (let d = 0; d < 5; d++) {
      add(d, 14);
      add(d, 20, 30);
    }
    add(5, 14);
    add(6, 15);
    return slots;
  }

  if (activityId === "fitness") {
    for (let d = 0; d < 5; d++) add(d, 17);
    add(5, 10);
    add(6, 11);
    return slots;
  }

  if (activityId === "reading") {
    for (let d = 0; d < 7; d++) add(d, 21);
    add(5, 14);
    add(6, 15);
    return slots;
  }

  if (activityId === "relaxation" || activityId === "social") {
    for (let d = 0; d < 7; d++) add(d, 20);
    return slots;
  }

  for (let d = 0; d < 7; d++) {
    for (let h = 9; h <= 20; h++) add(d, h);
  }

  return slots;
}

function place(
  blocks: ScheduleBlock[],
  day: number,
  start: number,
  duration: number,
  label: string,
  category: ScheduleBlock["category"],
  wake: number,
  sleep: number,
) {
  const end = start + duration;
  if (start < wake || end > sleep || clashes(blocks, day, start, end)) {
    return null;
  }

  return { id: uid(), day, start, end, label, category };
}

function findGap(
  blocks: ScheduleBlock[],
  day: number,
  duration: number,
  wake: number,
  sleep: number,
  label: string,
  category: ScheduleBlock["category"],
) {
  for (let start = wake; start + duration <= sleep; start += 30) {
    const block = place(blocks, day, start, duration, label, category, wake, sleep);
    if (block) return block;
  }
  return null;
}

export function buildSchedule(setup: SetupState): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  const wake = timeToMinutes(setup.wakeTime);
  const sleepEnd = timeToMinutes(setup.sleepTime);
  const sleep = sleepEnd - 30;

  for (let day = 0; day < 7; day++) {
    blocks.push({
      id: uid(),
      day,
      start: wake,
      end: wake + 30,
      label: "Wake Up",
      category: "fixed",
    });
    blocks.push({
      id: uid(),
      day,
      start: sleep,
      end: sleepEnd,
      label: "Sleep",
      category: "fixed",
    });
  }

  for (const event of setup.fixedEvents) {
    blocks.push({
      id: uid(),
      day: event.day,
      start: event.start,
      end: event.end,
      label: event.label,
      category: "fixed",
    });
  }

  for (const activityId of setup.selectedActivities) {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) continue;

    const commitment = setup.commitments[activityId];
    const needed = parseCount(commitment?.timesPerWeek ?? "3x / week");
    const duration = parseMins(commitment?.duration ?? "60 min");
    let placed = 0;

    for (const slot of slotsFor(activityId, wake, sleep, duration)) {
      if (placed >= needed) break;

      const label =
        activityId === "meals"
          ? slot.start < 300
            ? "Lunch"
            : "Dinner"
          : activity.blockLabel;

      const block = place(
        blocks,
        slot.day,
        slot.start,
        duration,
        label,
        activity.category,
        wake,
        sleep,
      );

      if (block) {
        blocks.push(block);
        placed++;
      }
    }

    while (placed < needed) {
      let found = false;
      for (let day = 0; day < 7 && placed < needed; day++) {
        const block = findGap(
          blocks,
          day,
          duration,
          wake,
          sleep,
          activity.blockLabel,
          activity.category,
        );
        if (block) {
          blocks.push(block);
          placed++;
          found = true;
        }
      }
      if (!found) break;
    }
  }

  for (let day = 0; day < 7; day++) {
    const dayBlocks = blocks
      .filter((b) => b.day === day)
      .sort((a, b) => a.start - b.start);

    let cursor = wake;

    for (const block of dayBlocks) {
      if (block.start - cursor >= 30) {
        blocks.push({
          id: uid(),
          day,
          start: cursor,
          end: block.start,
          label: "Free Time",
          category: "free",
        });
      }
      cursor = Math.max(cursor, block.end);
    }

    if (sleep - cursor >= 30) {
      blocks.push({
        id: uid(),
        day,
        start: cursor,
        end: sleep,
        label: "Free Time",
        category: "free",
      });
    }
  }

  return blocks.sort((a, b) => a.day - b.day || a.start - b.start);
}

export function setupChecklist(setup: SetupState, hasSchedule: boolean) {
  return [
    { label: "Wake & sleep times", done: Boolean(setup.wakeTime && setup.sleepTime) },
    { label: "Activities picked", done: setup.selectedActivities.length > 0 },
    { label: "Fixed events", done: setup.fixedEvents.length > 0 },
    { label: "Schedule built", done: hasSchedule },
  ];
}

export function scheduleHealth(blocks: ScheduleBlock[]) {
  const free = blocks.filter((b) => b.category === "free");
  const busy = blocks.filter(
    (b) => b.category !== "fixed" && b.category !== "free",
  );

  if (busy.length === 0) {
    return { status: "light" as const, message: "Generate a schedule first." };
  }

  const ratio = free.length / busy.length;

  if (ratio < 0.15) {
    return { status: "busy" as const, message: "Pretty packed week." };
  }
  if (ratio > 0.6) {
    return { status: "light" as const, message: "Lots of open time." };
  }
  return { status: "balanced" as const, message: "Looks balanced." };
}

export function todayBlocks(blocks: ScheduleBlock[]) {
  const today = new Date().getDay();
  const day = today === 0 ? 6 : today - 1;
  return blocks.filter((b) => b.day === day).sort((a, b) => a.start - b.start);
}

export function weekPreview(blocks: ScheduleBlock[]) {
  const rows = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"];
  const hours = [8, 10, 12, 14, 16, 18, 20];

  return hours.map((hour, rowIndex) => ({
    time: rows[rowIndex],
    cells: Array.from({ length: 7 }, (_, day) => {
      const start = (hour - 7) * 60;
      const end = start + 120;

      const hit = blocks
        .filter(
          (b) =>
            b.day === day &&
            b.category !== "fixed" &&
            b.start < end &&
            start < b.end,
        )
        .sort((a, b) => b.end - b.start - (a.end - a.start))[0];

      return hit?.label ?? "—";
    }),
  }));
}
