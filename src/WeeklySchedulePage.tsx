import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import type { AppPage } from "./AppShell";
import { useAppState } from "./context/AppStateContext";
import EditScheduleBlockModal from "./EditScheduleBlockModal";
import { scheduleHealth } from "./lib/schedule";
import {
  blockPosition,
  days,
  formatDayHeader,
  formatTimeRange,
  formatWeekRange,
  hourLabels,
} from "./lib/time";
import "./WeeklySchedule.css";

const legend = [
  ["Fixed", "fixed"],
  ["Study", "study"],
  ["Fitness", "fitness"],
  ["Meal", "meal"],
  ["Relax", "relaxation"],
  ["Free", "free"],
] as const;

type Props = {
  onNavigate: (page: AppPage) => void;
};

export default function WeeklySchedulePage({ onNavigate }: Props) {
  const {
    state,
    generateSchedule,
    updateBlock,
    deleteBlock,
    setWeekOffset,
    setSetupStep,
    clearScheduleWarnings,
  } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmRebuild, setConfirmRebuild] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { setup, schedule, ui } = state;
  const blocks = schedule.blocks;
  const warnings = schedule.warnings ?? [];

  const editing = useMemo(
    () => blocks.find((b) => b.id === editingId) ?? null,
    [blocks, editingId],
  );

  const health = scheduleHealth(blocks);

  function rebuild() {
    setEditingId(null);
    generateSchedule();
    setConfirmRebuild(false);
    setToast("Schedule rebuilt from setup. Previous block edits were replaced.");
    setTimeout(() => setToast(null), 3200);
  }

  function editInputs() {
    setSetupStep(1);
    onNavigate("setup");
  }

  return (
    <div className="weekly-schedule-page">
      <div className="weekly-schedule-layout">
        <div className="weekly-schedule-main">
          <header className="weekly-schedule-header">
            <div>
              <h1>Schedule</h1>
              <p>Tap a block to change it.</p>
            </div>

            <div className="header-actions">
              {blocks.length > 0 && (
                <>
                  {confirmRebuild ? (
                    <div className="regenerate-confirm">
                      <span>
                        Rebuild from setup? This replaces the calendar,
                        including any block edits you made.
                      </span>
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
                        onClick={rebuild}
                      >
                        <RefreshCcw size={16} />
                        Rebuild
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => setConfirmRebuild(true)}
                    >
                      <RefreshCcw size={16} />
                      Rebuild
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                className="secondary-btn"
                onClick={editInputs}
              >
                <Pencil size={16} />
                Edit inputs
              </button>
            </div>
          </header>

          {toast && <div className="toast">{toast}</div>}

          {warnings.length > 0 && (
            <div className="schedule-warnings" role="status">
              <strong>Some items could not be fully scheduled</strong>
              <ul>
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <button
                type="button"
                className="schedule-warnings-dismiss"
                onClick={clearScheduleWarnings}
              >
                Dismiss
              </button>
            </div>
          )}

          {!blocks.length ? (
            <section className="card weekly-empty-card">
              <h2>No schedule yet</h2>
              <p>Build one from your setup inputs.</p>
              <button type="button" className="primary-btn" onClick={rebuild}>
                Build schedule
              </button>
            </section>
          ) : (
            <section className="card weekly-calendar-card">
              <div className="week-nav">
                <button
                  type="button"
                  className="week-nav-btn"
                  aria-label="Previous week"
                  onClick={() => setWeekOffset(ui.weekOffset - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="week-nav-label">
                  {formatWeekRange(ui.weekOffset)}
                </span>
                <button
                  type="button"
                  className="week-nav-btn"
                  aria-label="Next week"
                  onClick={() => setWeekOffset(ui.weekOffset + 1)}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="week-nav-today"
                  onClick={() => setWeekOffset(0)}
                >
                  Today
                </button>
              </div>
              <p className="week-nav-note">
                Recurring weekly template — dates update with the week selector.
              </p>

              <div className="weekly-calendar">
                <div className="weekly-calendar-head">
                  <div className="weekly-calendar-corner" />
                  {days.map((_, dayIndex) => (
                    <div className="weekly-day-head" key={dayIndex}>
                      {formatDayHeader(dayIndex, ui.weekOffset)}
                    </div>
                  ))}
                </div>

                <div className="weekly-calendar-body">
                  <div className="weekly-time-axis">
                    {hourLabels.map((label) => (
                      <div className="weekly-time-label" key={label}>
                        {label}
                      </div>
                    ))}
                  </div>

                  {days.map((day, dayIndex) => (
                    <div className="weekly-day-column" key={day}>
                      {hourLabels.map((label) => (
                        <div
                          className="weekly-hour-line"
                          key={`${day}-${label}`}
                        />
                      ))}

                      {blocks
                        .filter((b) => b.day === dayIndex)
                        .map((block) => (
                          <div
                            key={block.id}
                            className={`schedule-block ${block.category}`}
                            style={blockPosition(block.start, block.end)}
                          >
                            <button
                              type="button"
                              className="schedule-block-edit"
                              aria-label={`Edit ${block.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(block.id);
                              }}
                            >
                              <Pencil size={10} />
                            </button>
                            <span className="schedule-block-label">
                              {block.label}
                            </span>
                            <span className="schedule-block-time">
                              {formatTimeRange(block.start, block.end)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="weekly-schedule-panel">
          <section className="card weekly-panel-card">
            <h2>Hours</h2>
            <div className="weekly-availability">
              <div className="weekly-availability-row">
                <span>Wake</span>
                <strong className="availability-value">{setup.wakeTime}</strong>
              </div>
              <div className="weekly-availability-row">
                <span>Sleep</span>
                <strong className="availability-value">{setup.sleepTime}</strong>
              </div>
            </div>
          </section>

          <section className="card weekly-panel-card">
            <h2>Legend</h2>
            <div className="weekly-legend">
              {legend.map(([label, tone]) => (
                <div className="weekly-legend-row" key={label}>
                  <span className={`legend-dot ${tone}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card weekly-panel-card weekly-health-card">
            <h2>Balance</h2>
            <div className={`weekly-health-note ${health.status}`}>
              <ShieldCheck size={16} />
              <p>{health.message}</p>
            </div>
          </section>
        </aside>
      </div>

      {editing && (
        <EditScheduleBlockModal
          key={editing.id}
          block={editing}
          onClose={() => setEditingId(null)}
          onSave={(updated) => {
            const result = updateBlock(updated);
            if (!result.ok) return result.error;
            setEditingId(null);
            return null;
          }}
          onDelete={(id) => {
            deleteBlock(id);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
