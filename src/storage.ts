import { useEffect, useState } from "react";

import type { AppState } from "./types";

const KEY = "autoschedule";

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
    schedule: { blocks: [], lastGeneratedAt: null },
    ui: { setupStep: 1, weekOffset: 0 },
  };
}

function readState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    return JSON.parse(raw) as AppState;
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
