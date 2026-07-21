import { Fragment, useState } from "react";
import {
  Sparkles,
  Pencil,
  CheckCircle2,
  Circle,
  BookOpen,
  Dumbbell,
  Utensils,
  CalendarPlus,
  ListChecks,
  Clock3,
  RefreshCcw,
  BarChart3,
  UsersRound,
  CalendarDays,
  Waves,
} from "lucide-react";

import { activities } from "./activities";
import FixedEventModal from "./components/FixedEventModal";
import type { AppPage } from "./AppShell";
import { useAppState } from "./context/AppStateContext";
import { todayBlocks, weekPreview } from "./lib/schedule";
import { formatTime12h } from "./lib/time";
import type { BlockCategory } from "./types";

const previewDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const icons: Record<BlockCategory, typeof BookOpen> = {
  fixed: BookOpen,
  study: BookOpen,
  fitness: Dumbbell,
  meal: Utensils,
  relaxation: Waves,
  free: Clock3,
};

const colors: Record<BlockCategory, string> = {
  fixed: "blue",
  study: "purple",
  fitness: "teal",
  meal: "green",
  relaxation: "blue",
  free: "green",
};

const quickActions = [
  { id: "fixed", label: "Add event", icon: CalendarPlus, tone: "blue" },
  { id: "activities", label: "Activities", icon: ListChecks, tone: "purple" },
  { id: "availability", label: "Wake / sleep", icon: Clock3, tone: "green" },
  { id: "regenerate", label: "Rebuild", icon: RefreshCcw, tone: "teal" },
] as const;

type Props = {
  onNavigate: (page: AppPage) => void;
};

export default function DashboardHome({ onNavigate }: Props) {
  const {
    state,
    checklist,
    hasSchedule,
    generateSchedule,
    addFixedEvent,
    setSetupStep,
    clearScheduleWarnings,
  } = useAppState();
  const [showEventModal, setShowEventModal] = useState(false);
  const [confirmRebuild, setConfirmRebuild] = useState(false);

  const { setup, schedule, auth } = state;
  const done = checklist.filter((i) => i.done).length;
  const progress = Math.round((done / checklist.length) * 100);
  const today = todayBlocks(schedule.blocks);
  const preview = weekPreview(schedule.blocks);
  const tags = activities.filter((a) => setup.selectedActivities.includes(a.id));

  const name = auth.username || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? `Morning, ${name}`
      : hour < 17
        ? `Afternoon, ${name}`
        : `Evening, ${name}`;

  function goSetup(step: 1 | 2 | 3 = 1) {
    setSetupStep(step);
    onNavigate("setup");
  }

  function onQuickAction(id: (typeof quickActions)[number]["id"]) {
    if (id === "fixed") {
      setShowEventModal(true);
      return;
    }
    if (id === "activities" || id === "availability") {
      goSetup(1);
      return;
    }
    if (id === "regenerate") {
      if (!schedule.blocks.length) {
        generateSchedule();
        onNavigate("weekly-schedule");
        return;
      }
      setConfirmRebuild(true);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>{greeting}</h1>
          <p>Your week at a glance.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              generateSchedule();
              onNavigate("weekly-schedule");
            }}
          >
            <Sparkles size={18} fill="currentColor" />
            {hasSchedule ? "Rebuild schedule" : "Build schedule"}
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => goSetup(1)}
          >
            <Pencil size={18} />
            Edit inputs
          </button>
        </div>
      </header>

      {confirmRebuild && (
        <div className="dashboard-regenerate-confirm card">
          <p>
            Rebuild from your current setup? This replaces the calendar,
            including any block edits you made.
          </p>
          <div className="dashboard-regenerate-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setConfirmRebuild(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                generateSchedule();
                setConfirmRebuild(false);
                onNavigate("weekly-schedule");
              }}
            >
              <RefreshCcw size={16} />
              Rebuild
            </button>
          </div>
        </div>
      )}

      {(schedule.warnings?.length ?? 0) > 0 && (
        <div className="dashboard-regenerate-confirm card">
          <p>
            <strong>Schedule warnings:</strong>{" "}
            {schedule.warnings.join(" ")}
          </p>
          <div className="dashboard-regenerate-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={clearScheduleWarnings}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => onNavigate("weekly-schedule")}
            >
              View schedule
            </button>
          </div>
        </div>
      )}

      <section className="dashboard-grid">
        <div className="left-column">
          <section className="card setup-card">
            <h2>Setup</h2>

            <div className="progress-percent">
              <strong>{progress}%</strong>
              <span>done</span>
            </div>

            <div className="progress-track">
              <div style={{ width: `${progress}%` }} />
            </div>

            <div className="progress-list">
              {checklist.map((item) => (
                <div className="progress-row" key={item.label}>
                  {item.done ? (
                    <CheckCircle2
                      className="done-icon"
                      size={20}
                      fill="currentColor"
                    />
                  ) : (
                    <Circle className="empty-icon" size={20} />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card today-card">
            <h2>Today</h2>

            <div className="today-list">
              {!today.length && (
                <p className="today-empty">No schedule yet.</p>
              )}

              {today.map((item) => {
                const Icon = icons[item.category];
                return (
                  <div className="today-row" key={item.id}>
                    <div className={`today-icon ${colors[item.category]}`}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <span className="today-time">
                      {formatTime12h(item.start)}
                    </span>
                    <span className="today-label">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="center-column">
          <section className="card weekly-card">
            <h2>This week</h2>

            <div className="week-table">
              <div className="week-header spacer" />
              {previewDays.map((day) => (
                <div className="week-header" key={day}>
                  {day}
                </div>
              ))}

              {preview.map((row) => (
                <Fragment key={row.time}>
                  <div className="time-label">{row.time}</div>
                  {row.cells.map((cell, i) => (
                    <div
                      className={`week-block ${cell.category}`}
                      key={`${row.time}-${i}`}
                      title={cell.label}
                    >
                      {cell.label}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>

            <button
              type="button"
              className="open-schedule-btn"
              onClick={() => onNavigate("weekly-schedule")}
            >
              <CalendarDays size={18} />
              Full schedule
            </button>
          </section>

          <section className="card quick-card">
            <h2>Shortcuts</h2>

            <div className="quick-grid">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    type="button"
                    className="quick-action"
                    key={action.id}
                    onClick={() => onQuickAction(action.id)}
                  >
                    <div className={`quick-icon ${action.tone}`}>
                      <Icon size={26} strokeWidth={2} />
                    </div>
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="right-panel card">
          <section className="stats-section">
            <div className="section-title-row">
              <div className="round-icon purple">
                <BarChart3 size={22} strokeWidth={2.2} />
              </div>
              <h2>Stats</h2>
            </div>

            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-dot purple" />
                <strong>{setup.selectedActivities.length}</strong>
                <span>activities</span>
              </div>
              <div className="stat-row">
                <span className="stat-dot blue" />
                <strong>{setup.fixedEvents.length}</strong>
                <span>fixed events</span>
              </div>
              <div className="stat-row">
                <span className="stat-dot teal" />
                <strong>{schedule.blocks.length}</strong>
                <span>blocks</span>
              </div>
              <div className="stat-row">
                <span className="stat-dot green" />
                <strong>
                  {schedule.blocks.filter((b) => b.category === "free").length}
                </strong>
                <span>free blocks</span>
              </div>
            </div>
          </section>

          <div className="panel-divider" />

          <section className="availability-section">
            <div className="section-title-row">
              <div className="round-icon teal">
                <Clock3 size={22} strokeWidth={2.2} />
              </div>
              <h2>Hours</h2>
            </div>

            <div className="availability-table">
              <div>Wake</div>
              <strong>{setup.wakeTime}</strong>
              <div>Sleep</div>
              <strong>{setup.sleepTime}</strong>
            </div>
          </section>

          <div className="panel-divider" />

          <section>
            <div className="section-title-row">
              <div className="round-icon lavender">
                <UsersRound size={22} strokeWidth={2.2} />
              </div>
              <h2>Activities</h2>
            </div>

            <div className="activity-tags">
              {!tags.length && <span className="tag gray">None yet</span>}
              {tags.map((item) => (
                <span className={`tag ${item.tone}`} key={item.id}>
                  {item.label}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {showEventModal && (
        <FixedEventModal
          onClose={() => setShowEventModal(false)}
          onSave={(event) => {
            const result = addFixedEvent(event);
            if (!result.ok) return result.error;
            setShowEventModal(false);
            return null;
          }}
        />
      )}
    </>
  );
}
