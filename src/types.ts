export type ActivityId =
  | "fitness"
  | "studying"
  | "reading"
  | "hobbies"
  | "meals"
  | "relaxation"
  | "social";

export type Commitment = {
  timesPerWeek: string;
  duration: string;
};

export type FixedEvent = {
  id: string;
  label: string;
  day: number;
  start: number;
  end: number;
};

export type BlockCategory =
  | "fixed"
  | "study"
  | "fitness"
  | "meal"
  | "relaxation"
  | "free";

export type ScheduleBlock = {
  id: string;
  day: number;
  start: number;
  end: number;
  label: string;
  category: BlockCategory;
};

export type SetupState = {
  wakeTime: string;
  sleepTime: string;
  selectedActivities: ActivityId[];
  commitments: Partial<Record<ActivityId, Commitment>>;
  fixedEvents: FixedEvent[];
};

export type AppState = {
  auth: {
    isAuthenticated: boolean;
    username: string;
  };
  setup: SetupState;
  schedule: {
    blocks: ScheduleBlock[];
    lastGeneratedAt: string | null;
  };
  ui: {
    setupStep: 1 | 2 | 3;
    weekOffset: number;
  };
};
