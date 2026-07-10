import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Dumbbell,
  Palette,
  Users,
  Utensils,
  Waves,
} from "lucide-react";

import type { ActivityId, BlockCategory } from "./types";

export type ActivityTone =
  | "teal"
  | "purple"
  | "yellow"
  | "gray"
  | "green"
  | "blue";

export type ActivityOption = {
  id: ActivityId;
  label: string;
  icon: LucideIcon;
  tone: ActivityTone;
  category: BlockCategory;
  blockLabel: string;
};

export const activities: ActivityOption[] = [
  {
    id: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    tone: "teal",
    category: "fitness",
    blockLabel: "Gym",
  },
  {
    id: "studying",
    label: "Studying",
    icon: BookOpen,
    tone: "purple",
    category: "study",
    blockLabel: "Study",
  },
  {
    id: "reading",
    label: "Reading",
    icon: BookOpen,
    tone: "yellow",
    category: "study",
    blockLabel: "Reading",
  },
  {
    id: "hobbies",
    label: "Hobbies",
    icon: Palette,
    tone: "gray",
    category: "relaxation",
    blockLabel: "Hobbies",
  },
  {
    id: "meals",
    label: "Meals",
    icon: Utensils,
    tone: "green",
    category: "meal",
    blockLabel: "Meal",
  },
  {
    id: "relaxation",
    label: "Relaxation",
    icon: Waves,
    tone: "blue",
    category: "relaxation",
    blockLabel: "Relaxation",
  },
  {
    id: "social",
    label: "Social Time",
    icon: Users,
    tone: "gray",
    category: "relaxation",
    blockLabel: "Social Time",
  },
];

export const timesPerWeekOptions = [
  "2x / week",
  "3x / week",
  "4x / week",
  "5x / week",
  "7x / week",
];

export const durationOptions = [
  "30 min",
  "45 min",
  "60 min",
  "90 min",
  "120 min",
];
