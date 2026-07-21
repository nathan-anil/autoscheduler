import { activities } from "../activities";
import type { ActivityId, ScheduleBlock, SetupState } from "../types";
import { timeToMinutes } from "./time";

export type BuildScheduleResult = {
  blocks: ScheduleBlock[];
  warnings: string[];
};

function uid() {
  return crypto.randomUUID();
}

/** True when [start, end) overlaps any block on the same day (optionally ignoring one id). */
export function blocksClash(
  blocks: ScheduleBlock[],
  day: number,
  start: number,
  end: number,
  ignoreId?: string,
) {
  return blocks.some(
    (b) =>
      b.id !== ignoreId &&
      b.day === day &&
      b.start < end &&
      start < b.end,
  );
}

function parseCount(value: string) {
  return Number.parseInt(value, 10) || 0;
}

function parseMins(value: string) {
  return Number.parseInt(value, 10) || 60;
}

function mealLabel(start: number) {
  // Noon is offset 300 (12:00 PM). Treat mid-day meals as Lunch, evening as Dinner.
  return start <= 300 ? "Lunch" : "Dinner";
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
  if (
    start < wake ||
    end > sleep ||
    blocksClash(blocks, day, start, end)
  ) {
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

function fillFreeTime(
  blocks: ScheduleBlock[],
  wake: number,
  sleep: number,
) {
  const withFree = [...blocks];

  for (let day = 0; day < 7; day++) {
    const dayBlocks = withFree
      .filter((b) => b.day === day)
      .sort((a, b) => a.start - b.start);

    let cursor = wake;

    for (const block of dayBlocks) {
      if (block.start - cursor >= 30) {
        withFree.push({
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
      withFree.push({
        id: uid(),
        day,
        start: cursor,
        end: sleep,
        label: "Free Time",
        category: "free",
      });
    }
  }

  return withFree;
}

/**
 * Build a weekly schedule from setup inputs.
 * Returns warnings when activities cannot be fully placed or fixed events are skipped.
 */
export function buildSchedule(setup: SetupState): BuildScheduleResult {
  const warnings: string[] = [];
  const blocks: ScheduleBlock[] = [];

  const wake = timeToMinutes(setup.wakeTime);
  const sleepEnd = timeToMinutes(setup.sleepTime);

  if (wake === null || sleepEnd === null) {
    return {
      blocks: [],
      warnings: ["Wake or sleep time is invalid. Fix times in Setup and try again."],
    };
  }

  if (sleepEnd <= wake) {
    return {
      blocks: [],
      warnings: ["Sleep time must be after wake time."],
    };
  }

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
    if (event.end <= event.start) {
      warnings.push(
        `Skipped fixed event "${event.label}" — end time must be after start.`,
      );
      continue;
    }

    // Fixed events must not overlap wake/sleep blocks or other placed fixed events.
    if (blocksClash(blocks, event.day, event.start, event.end)) {
      warnings.push(
        `Skipped fixed event "${event.label}" — it overlaps wake, sleep, or another fixed event.`,
      );
      continue;
    }

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
        activityId === "meals" ? mealLabel(slot.start) : activity.blockLabel;

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
        const label =
          activityId === "meals" ? "Meal" : activity.blockLabel;

        const block = findGap(
          blocks,
          day,
          duration,
          wake,
          sleep,
          label,
          activity.category,
        );
        if (block) {
          // Prefer Lunch/Dinner labels when we know the placed start time.
          if (activityId === "meals") {
            block.label = mealLabel(block.start);
          }
          blocks.push(block);
          placed++;
          found = true;
        }
      }
      if (!found) break;
    }

    if (placed < needed) {
      warnings.push(
        `Could only place ${placed} of ${needed} "${activity.label}" blocks — not enough open time.`,
      );
    }
  }

  const withFree = fillFreeTime(blocks, wake, sleep);

  return {
    blocks: withFree.sort((a, b) => a.day - b.day || a.start - b.start),
    warnings,
  };
}

/** Returns an error message if a fixed event overlaps wake/sleep, otherwise null. */
export function fixedEventWakeSleepError(
  event: { start: number; end: number },
  wakeTime: string,
  sleepTime: string,
): string | null {
  const wake = timeToMinutes(wakeTime);
  const sleepEnd = timeToMinutes(sleepTime);
  if (wake === null || sleepEnd === null) {
    return "Wake or sleep time is invalid. Fix times in Setup first.";
  }

  const wakeEnd = wake + 30;
  const sleepStart = sleepEnd - 30;

  if (event.start < wakeEnd && wake < event.end) {
    return "Event overlaps the wake-up block. Move it later or adjust wake time.";
  }
  if (event.start < sleepEnd && sleepStart < event.end) {
    return "Event overlaps the sleep block. Move it earlier or adjust sleep time.";
  }
  return null;
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

export type PreviewCell = {
  label: string;
  category: ScheduleBlock["category"];
};

/** Hourly preview including fixed events; lists overlapping labels in a cell. */
export function weekPreview(blocks: ScheduleBlock[]) {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  return hours.map((hour) => {
    const start = (hour - 7) * 60;
    const end = start + 60;
    const h24 = hour;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    const time = `${h12} ${period}`;

    return {
      time,
      cells: Array.from({ length: 7 }, (_, day) => {
        const hits = blocks
          .filter(
            (b) =>
              b.day === day &&
              b.category !== "free" &&
              b.start < end &&
              start < b.end,
          )
          .sort((a, b) => a.start - b.start);

        if (!hits.length) {
          return { label: "—", category: "free" as const } satisfies PreviewCell;
        }

        // Prefer the longest overlap; include fixed events.
        const primary = [...hits].sort(
          (a, b) => b.end - b.start - (a.end - a.start),
        )[0];

        const label =
          hits.length === 1
            ? primary.label
            : hits.map((h) => h.label).join(" · ");

        return {
          label,
          category: primary.category,
        } satisfies PreviewCell;
      }),
    };
  });
}
