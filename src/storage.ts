import { useEffect, useState } from "react";

import type {
  ActivityId,
  AppState,
  BlockCategory,
  Commitment,
  FixedEvent,
  ScheduleBlock,
  SetupState,
} from "./types";

const KEY = "autoschedule";

const ACTIVITY_IDS = new Set<ActivityId>([
  "fitness",
  "studying",
  "reading",
  "hobbies",
  "meals",
  "relaxation",
  "social",
]);

const BLOCK_CATEGORIES = new Set<BlockCategory>([
  "fixed",
  "study",
  "fitness",
  "meal",
  "relaxation",
  "free",
]);

const PAGES = new Set(["dashboard", "setup", "weekly-schedule"]);

export function initialState(): AppState {
  return {
    auth: { isAuthenticated: false, username: "" },
    setup: {
      wakeTime: "7:00 AM",
      sleepTime: "11:00 PM",
      selectedActivities: [
        "fitness",
        "studying",
        "reading",
        "meals",
        "relaxation",
      ],
      commitments: {
        fitness: { timesPerWeek: "3x / week", duration: "60 min" },
        studying: { timesPerWeek: "5x / week", duration: "90 min" },
        reading: { timesPerWeek: "4x / week", duration: "45 min" },
        meals: { timesPerWeek: "7x / week", duration: "30 min" },
        relaxation: { timesPerWeek: "3x / week", duration: "30 min" },
      },
      fixedEvents: [
        { id: "class-mon", label: "Class", day: 0, start: 120, end: 210 },
        { id: "class-wed", label: "Class", day: 2, start: 120, end: 210 },
        { id: "class-fri", label: "Class", day: 4, start: 120, end: 210 },
      ],
    },
    schedule: { blocks: [], lastGeneratedAt: null, warnings: [] },
    ui: { setupStep: 1, weekOffset: 0, page: "dashboard" },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActivityId(value: unknown): value is ActivityId {
  return typeof value === "string" && ACTIVITY_IDS.has(value as ActivityId);
}

function parseCommitment(value: unknown): Commitment | null {
  if (!isRecord(value)) return null;
  if (typeof value.timesPerWeek !== "string") return null;
  if (typeof value.duration !== "string") return null;
  return {
    timesPerWeek: value.timesPerWeek,
    duration: value.duration,
  };
}

function parseFixedEvent(value: unknown): FixedEvent | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.label !== "string") return null;
  if (typeof value.day !== "number" || value.day < 0 || value.day > 6) {
    return null;
  }
  if (typeof value.start !== "number" || typeof value.end !== "number") {
    return null;
  }
  return {
    id: value.id,
    label: value.label,
    day: value.day,
    start: value.start,
    end: value.end,
  };
}

function parseBlock(value: unknown): ScheduleBlock | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.label !== "string") return null;
  if (typeof value.day !== "number" || value.day < 0 || value.day > 6) {
    return null;
  }
  if (typeof value.start !== "number" || typeof value.end !== "number") {
    return null;
  }
  if (
    typeof value.category !== "string" ||
    !BLOCK_CATEGORIES.has(value.category as BlockCategory)
  ) {
    return null;
  }

  const block: ScheduleBlock = {
    id: value.id,
    day: value.day,
    start: value.start,
    end: value.end,
    label: value.label,
    category: value.category as BlockCategory,
  };

  if (value.manual === true) block.manual = true;
  return block;
}

function parseSetup(value: unknown, fallback: SetupState): SetupState {
  if (!isRecord(value)) return fallback;

  const selectedActivities = Array.isArray(value.selectedActivities)
    ? value.selectedActivities.filter(isActivityId)
    : fallback.selectedActivities;

  const commitments: SetupState["commitments"] = {};
  if (isRecord(value.commitments)) {
    for (const [key, commitment] of Object.entries(value.commitments)) {
      if (!isActivityId(key)) continue;
      const parsed = parseCommitment(commitment);
      if (parsed) commitments[key] = parsed;
    }
  } else {
    Object.assign(commitments, fallback.commitments);
  }

  const fixedEvents = Array.isArray(value.fixedEvents)
    ? value.fixedEvents
        .map(parseFixedEvent)
        .filter((e): e is FixedEvent => e !== null)
    : fallback.fixedEvents;

  return {
    wakeTime:
      typeof value.wakeTime === "string" ? value.wakeTime : fallback.wakeTime,
    sleepTime:
      typeof value.sleepTime === "string" ? value.sleepTime : fallback.sleepTime,
    selectedActivities,
    commitments,
    fixedEvents,
  };
}

function parseState(raw: unknown): AppState {
  const base = initialState();
  if (!isRecord(raw)) return base;

  const auth = isRecord(raw.auth)
    ? {
        isAuthenticated: Boolean(raw.auth.isAuthenticated),
        username:
          typeof raw.auth.username === "string" ? raw.auth.username : "",
      }
    : base.auth;

  const setup = parseSetup(raw.setup, base.setup);

  let blocks: ScheduleBlock[] = [];
  let lastGeneratedAt: string | null = null;
  let warnings: string[] = [];

  if (isRecord(raw.schedule)) {
    if (Array.isArray(raw.schedule.blocks)) {
      blocks = raw.schedule.blocks
        .map(parseBlock)
        .filter((b): b is ScheduleBlock => b !== null);
    }
    if (
      typeof raw.schedule.lastGeneratedAt === "string" ||
      raw.schedule.lastGeneratedAt === null
    ) {
      lastGeneratedAt = raw.schedule.lastGeneratedAt;
    }
    if (Array.isArray(raw.schedule.warnings)) {
      warnings = raw.schedule.warnings.filter(
        (w): w is string => typeof w === "string",
      );
    }
  }

  const uiRaw = isRecord(raw.ui) ? raw.ui : {};
  const setupStep =
    uiRaw.setupStep === 1 || uiRaw.setupStep === 2 || uiRaw.setupStep === 3
      ? uiRaw.setupStep
      : 1;
  const weekOffset =
    typeof uiRaw.weekOffset === "number" && Number.isFinite(uiRaw.weekOffset)
      ? Math.trunc(uiRaw.weekOffset)
      : 0;
  const page =
    typeof uiRaw.page === "string" && PAGES.has(uiRaw.page)
      ? (uiRaw.page as AppState["ui"]["page"])
      : blocks.length > 0
        ? "dashboard"
        : "setup";

  return {
    auth,
    setup,
    schedule: { blocks, lastGeneratedAt, warnings },
    ui: { setupStep, weekOffset, page },
  };
}

function readState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    return parseState(JSON.parse(raw));
  } catch {
    return initialState();
  }
}

export function useStoredState() {
  const [state, setState] = useState(readState);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}
