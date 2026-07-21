import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  blocksClash,
  buildSchedule,
  fixedEventWakeSleepError,
  setupChecklist,
} from "../lib/schedule";
import { useStoredState } from "../storage";
import type {
  ActivityId,
  AppState,
  Commitment,
  FixedEvent,
  ScheduleBlock,
  SetupState,
} from "../types";

type MutationResult = { ok: true } | { ok: false; error: string };

type AppPage = NonNullable<AppState["ui"]["page"]>;

type AppStore = {
  state: AppState;
  checklist: ReturnType<typeof setupChecklist>;
  hasSchedule: boolean;
  updateSetup: (partial: Partial<SetupState>) => void;
  toggleActivity: (id: ActivityId) => void;
  updateCommitment: (
    id: ActivityId,
    field: keyof Commitment,
    value: string,
  ) => void;
  addFixedEvent: (event: Omit<FixedEvent, "id">) => MutationResult;
  updateFixedEvent: (event: FixedEvent) => MutationResult;
  deleteFixedEvent: (id: string) => void;
  generateSchedule: () => void;
  updateBlock: (block: ScheduleBlock) => MutationResult;
  deleteBlock: (id: string) => void;
  setSetupStep: (step: 1 | 2 | 3) => void;
  setWeekOffset: (offset: number) => void;
  setPage: (page: AppPage) => void;
  clearScheduleWarnings: () => void;
  login: (username: string) => void;
  logout: () => void;
};

const AppStateContext = createContext<AppStore | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useStoredState();

  const hasSchedule = state.schedule.blocks.length > 0;
  const checklist = useMemo(
    () => setupChecklist(state.setup, hasSchedule),
    [state.setup, hasSchedule],
  );

  const updateSetup = useCallback((partial: Partial<SetupState>) => {
    setState((prev) => ({
      ...prev,
      setup: { ...prev.setup, ...partial },
    }));
  }, [setState]);

  const toggleActivity = useCallback((id: ActivityId) => {
    setState((prev) => {
      const selected = new Set(prev.setup.selectedActivities);
      const commitments = { ...prev.setup.commitments };

      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
        if (!commitments[id]) {
          commitments[id] = { timesPerWeek: "3x / week", duration: "60 min" };
        }
      }

      return {
        ...prev,
        setup: {
          ...prev.setup,
          selectedActivities: [...selected],
          commitments,
        },
      };
    });
  }, [setState]);

  const updateCommitment = useCallback(
    (id: ActivityId, field: keyof Commitment, value: string) => {
      setState((prev) => ({
        ...prev,
        setup: {
          ...prev.setup,
          commitments: {
            ...prev.setup.commitments,
            [id]: {
              timesPerWeek: "3x / week",
              duration: "60 min",
              ...prev.setup.commitments[id],
              [field]: value,
            },
          },
        },
      }));
    },
    [setState],
  );

  const addFixedEvent = useCallback((event: Omit<FixedEvent, "id">): MutationResult => {
    if (event.end <= event.start) {
      return { ok: false, error: "End time must be after start time." };
    }

    let result: MutationResult = { ok: true };

    setState((prev) => {
      const wakeSleepError = fixedEventWakeSleepError(
        event,
        prev.setup.wakeTime,
        prev.setup.sleepTime,
      );
      if (wakeSleepError) {
        result = { ok: false, error: wakeSleepError };
        return prev;
      }

      const overlapsOther = prev.setup.fixedEvents.some(
        (e) =>
          e.day === event.day &&
          e.start < event.end &&
          event.start < e.end,
      );

      if (overlapsOther) {
        result = {
          ok: false,
          error: "This event overlaps another fixed event.",
        };
        return prev;
      }

      return {
        ...prev,
        setup: {
          ...prev.setup,
          fixedEvents: [
            ...prev.setup.fixedEvents,
            { ...event, id: crypto.randomUUID() },
          ],
        },
      };
    });

    return result;
  }, [setState]);

  const updateFixedEvent = useCallback((event: FixedEvent): MutationResult => {
    if (event.end <= event.start) {
      return { ok: false, error: "End time must be after start time." };
    }

    let result: MutationResult = { ok: true };

    setState((prev) => {
      const wakeSleepError = fixedEventWakeSleepError(
        event,
        prev.setup.wakeTime,
        prev.setup.sleepTime,
      );
      if (wakeSleepError) {
        result = { ok: false, error: wakeSleepError };
        return prev;
      }

      const overlapsOther = prev.setup.fixedEvents.some(
        (e) =>
          e.id !== event.id &&
          e.day === event.day &&
          e.start < event.end &&
          event.start < e.end,
      );

      if (overlapsOther) {
        result = {
          ok: false,
          error: "This event overlaps another fixed event.",
        };
        return prev;
      }

      return {
        ...prev,
        setup: {
          ...prev.setup,
          fixedEvents: prev.setup.fixedEvents.map((e) =>
            e.id === event.id ? event : e,
          ),
        },
      };
    });

    return result;
  }, [setState]);

  const deleteFixedEvent = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      setup: {
        ...prev.setup,
        fixedEvents: prev.setup.fixedEvents.filter((e) => e.id !== id),
      },
    }));
  }, [setState]);

  const generateSchedule = useCallback(() => {
    setState((prev) => {
      const result = buildSchedule(prev.setup);

      return {
        ...prev,
        schedule: {
          blocks: result.blocks,
          lastGeneratedAt: new Date().toISOString(),
          warnings: result.warnings,
        },
      };
    });
  }, [setState]);

  const updateBlock = useCallback((block: ScheduleBlock): MutationResult => {
    if (block.end <= block.start) {
      return { ok: false, error: "End time must be after start time." };
    }

    let result: MutationResult = { ok: true };

    setState((prev) => {
      if (
        blocksClash(
          prev.schedule.blocks,
          block.day,
          block.start,
          block.end,
          block.id,
        )
      ) {
        result = {
          ok: false,
          error: "This block overlaps another block on that day.",
        };
        return prev;
      }

      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          blocks: prev.schedule.blocks.map((b) =>
            b.id === block.id ? { ...block, manual: true } : b,
          ),
        },
      };
    });

    return result;
  }, [setState]);

  const deleteBlock = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        blocks: prev.schedule.blocks.filter((b) => b.id !== id),
      },
    }));
  }, [setState]);

  const setSetupStep = useCallback((step: 1 | 2 | 3) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, setupStep: step },
    }));
  }, [setState]);

  const setWeekOffset = useCallback((offset: number) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, weekOffset: offset },
    }));
  }, [setState]);

  const setPage = useCallback((page: AppPage) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, page },
    }));
  }, [setState]);

  const clearScheduleWarnings = useCallback(() => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, warnings: [] },
    }));
  }, [setState]);

  const login = useCallback((username: string) => {
    setState((prev) => ({
      ...prev,
      auth: { isAuthenticated: true, username },
    }));
  }, [setState]);

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      auth: { isAuthenticated: false, username: "" },
    }));
  }, [setState]);

  const value = useMemo(
    () => ({
      state,
      checklist,
      hasSchedule,
      updateSetup,
      toggleActivity,
      updateCommitment,
      addFixedEvent,
      updateFixedEvent,
      deleteFixedEvent,
      generateSchedule,
      updateBlock,
      deleteBlock,
      setSetupStep,
      setWeekOffset,
      setPage,
      clearScheduleWarnings,
      login,
      logout,
    }),
    [
      state,
      checklist,
      hasSchedule,
      updateSetup,
      toggleActivity,
      updateCommitment,
      addFixedEvent,
      updateFixedEvent,
      deleteFixedEvent,
      generateSchedule,
      updateBlock,
      deleteBlock,
      setSetupStep,
      setWeekOffset,
      setPage,
      clearScheduleWarnings,
      login,
      logout,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const store = useContext(AppStateContext);
  if (!store) throw new Error("missing AppStateProvider");
  return store;
}
