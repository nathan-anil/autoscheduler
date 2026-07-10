import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  Users,
} from "lucide-react";

import {
  activities,
  durationOptions,
  timesPerWeekOptions,
} from "./activities";
import FixedEventModal from "./components/FixedEventModal";
import type { AppPage } from "./AppShell";
import { useAppState } from "./context/AppStateContext";
import { dayNames, formatTimeRange } from "./lib/time";
import type { FixedEvent } from "./types";
import "./Setup.css";

const STEPS = ["Routine", "Fixed events", "Review"] as const;

type SetupPageProps = {
  onNavigate: (page: AppPage) => void;
};

function weeklyHours(timesPerWeek: string, duration: string) {
  const count = Number.parseInt(timesPerWeek, 10) || 0;
  const mins = Number.parseInt(duration, 10) || 0;
  return (count * mins) / 60;
}

export default function SetupPage({ onNavigate }: SetupPageProps) {
  const {
    state,
    hasSchedule,
    toggleActivity,
    updateCommitment,
    updateSetup,
    addFixedEvent,
    updateFixedEvent,
    deleteFixedEvent,
    generateSchedule,
    setSetupStep,
  } = useAppState();

  const { setup, ui } = state;
  const [editingEvent, setEditingEvent] = useState<FixedEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const picked = activities.filter((a) =>
    setup.selectedActivities.includes(a.id),
  );

  const estimatedHours = useMemo(() => {
    const total = picked.reduce((sum, activity) => {
      const c = setup.commitments[activity.id];
      if (!c) return sum;
      return sum + weeklyHours(c.timesPerWeek, c.duration);
    }, 0);
    return total.toFixed(1);
  }, [picked, setup.commitments]);

  function saveEvent(event: Omit<FixedEvent, "id"> & { id?: string }) {
    if (event.id) updateFixedEvent(event as FixedEvent);
    else addFixedEvent(event);
  }

  return (
    <div className="setup-page">
      <div className="setup-layout">
        <div className="setup-main">
          <header className="setup-header">
            <div className="setup-steps">
              <p className="setup-step-label">
                Step {ui.setupStep} of 3 · {STEPS[ui.setupStep - 1]}
              </p>
              <div className="setup-step-bars">
                {STEPS.map((_, i) => (
                  <button
                    key={STEPS[i]}
                    type="button"
                    className={`setup-step-bar ${ui.setupStep >= i + 1 ? "active" : ""}`}
                    onClick={() => setSetupStep((i + 1) as 1 | 2 | 3)}
                  />
                ))}
              </div>
            </div>

            {ui.setupStep === 1 && (
              <>
                <h1>Weekly routine</h1>
                <p>When you&apos;re up, what you want in the week.</p>
              </>
            )}
            {ui.setupStep === 2 && (
              <>
                <h1>Fixed events</h1>
                <p>Classes, work — stuff that doesn&apos;t move.</p>
              </>
            )}
            {ui.setupStep === 3 && (
              <>
                <h1>Review</h1>
                <p>Looks good? Build the schedule.</p>
              </>
            )}
          </header>

          {ui.setupStep === 1 && (
            <div className="setup-sections">
              <section className="card setup-section">
                <div className="setup-section-title">
                  <span className="setup-section-badge">1</span>
                  <h2>Availability</h2>
                </div>

                <div className="availability-fields">
                  <label className="setup-field">
                    <span>Wake time</span>
                    <div className="setup-select-wrap">
                      <Clock3 size={16} />
                      <select
                        value={setup.wakeTime}
                        onChange={(e) =>
                          updateSetup({ wakeTime: e.target.value })
                        }
                      >
                        <option>6:00 AM</option>
                        <option>7:00 AM</option>
                        <option>8:00 AM</option>
                        <option>9:00 AM</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>

                  <label className="setup-field">
                    <span>Sleep time</span>
                    <div className="setup-select-wrap">
                      <Clock3 size={16} />
                      <select
                        value={setup.sleepTime}
                        onChange={(e) =>
                          updateSetup({ sleepTime: e.target.value })
                        }
                      >
                        <option>10:00 PM</option>
                        <option>11:00 PM</option>
                        <option>12:00 AM</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>
                </div>
              </section>

              <section className="card setup-section">
                <div className="setup-section-title">
                  <span className="setup-section-badge">2</span>
                  <h2>Activities</h2>
                </div>

                <div className="activity-picker">
                  {activities.map((activity) => {
                    const Icon = activity.icon;
                    const on = setup.selectedActivities.includes(activity.id);

                    return (
                      <button
                        key={activity.id}
                        type="button"
                        className={`activity-pick ${activity.tone} ${on ? "selected" : ""}`}
                        onClick={() => toggleActivity(activity.id)}
                      >
                        {on && (
                          <span className="activity-pick-check">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                        <div className="activity-pick-icon">
                          <Icon size={20} strokeWidth={2} />
                        </div>
                        <span>{activity.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="card setup-section setup-section-commitment">
                <div className="setup-section-title">
                  <span className="setup-section-badge">3</span>
                  <h2>Time per week</h2>
                </div>

                <div className="commitment-table">
                  <div className="commitment-head">
                    <span>Activity</span>
                    <span>Times / week</span>
                    <span>Duration</span>
                  </div>

                  {picked.map((activity) => {
                    const Icon = activity.icon;
                    const c = setup.commitments[activity.id];

                    return (
                      <div className="commitment-row" key={activity.id}>
                        <div className="commitment-activity">
                          <div className={`commitment-icon ${activity.tone}`}>
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <span>{activity.label}</span>
                        </div>

                        <div className="setup-select-wrap compact">
                          <select
                            value={c?.timesPerWeek ?? "3x / week"}
                            onChange={(e) =>
                              updateCommitment(
                                activity.id,
                                "timesPerWeek",
                                e.target.value,
                              )
                            }
                          >
                            {timesPerWeekOptions.map((opt) => (
                              <option key={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>

                        <div className="setup-select-wrap compact">
                          <select
                            value={c?.duration ?? "60 min"}
                            onChange={(e) =>
                              updateCommitment(
                                activity.id,
                                "duration",
                                e.target.value,
                              )
                            }
                          >
                            {durationOptions.map((opt) => (
                              <option key={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {ui.setupStep === 2 && (
            <section className="card setup-section">
              <div className="setup-section-title">
                <span className="setup-section-badge">1</span>
                <h2>Events</h2>
              </div>

              <div className="fixed-events-list">
                {setup.fixedEvents.length === 0 && (
                  <p className="fixed-events-empty">Nothing here yet.</p>
                )}

                {setup.fixedEvents.map((event) => (
                  <div className="fixed-event-row" key={event.id}>
                    <div className="fixed-event-row-info">
                      <CalendarDays size={18} />
                      <div>
                        <strong>{event.label}</strong>
                        <span>
                          {dayNames[event.day]} ·{" "}
                          {formatTimeRange(event.start, event.end)}
                        </span>
                      </div>
                    </div>
                    <div className="fixed-event-row-actions">
                      <button
                        type="button"
                        aria-label={`Edit ${event.label}`}
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEventModal(true);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${event.label}`}
                        onClick={() => deleteFixedEvent(event.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="setup-outline-btn fixed-events-add"
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
              >
                <Plus size={16} />
                Add event
              </button>
            </section>
          )}

          {ui.setupStep === 3 && (
            <section className="card setup-section setup-review">
              <div className="setup-review-grid">
                <div>
                  <div className="setup-review-row-head">
                    <h3>Availability</h3>
                    <button type="button" onClick={() => setSetupStep(1)}>
                      Edit
                    </button>
                  </div>
                  <p>
                    {setup.wakeTime} – {setup.sleepTime}
                  </p>
                </div>
                <div>
                  <div className="setup-review-row-head">
                    <h3>Activities</h3>
                    <button type="button" onClick={() => setSetupStep(1)}>
                      Edit
                    </button>
                  </div>
                  <p>{setup.selectedActivities.length} picked</p>
                </div>
                <div>
                  <div className="setup-review-row-head">
                    <h3>Fixed events</h3>
                    <button type="button" onClick={() => setSetupStep(2)}>
                      Edit
                    </button>
                  </div>
                  <p>{setup.fixedEvents.length}</p>
                </div>
                <div>
                  <h3>Hours / week</h3>
                  <p>{estimatedHours}</p>
                </div>
              </div>

              <div className="setup-review-activities">
                <h3>Activities</h3>
                <div className="setup-review-tags">
                  {picked.map((a) => (
                    <span key={a.id} className={`tag ${a.tone}`}>
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="primary-btn setup-generate-btn"
                onClick={() => {
                  generateSchedule();
                  onNavigate("weekly-schedule");
                }}
              >
                <Sparkles size={16} fill="currentColor" />
                {hasSchedule ? "Rebuild schedule" : "Build schedule"}
              </button>
            </section>
          )}

          <footer className="setup-footer">
            {ui.setupStep === 1 ? (
              <button
                type="button"
                className="setup-back-link"
                onClick={() => onNavigate("dashboard")}
              >
                <ArrowLeft size={16} />
                Dashboard
              </button>
            ) : (
              <button
                type="button"
                className="setup-back-link"
                onClick={() => setSetupStep((ui.setupStep - 1) as 1 | 2 | 3)}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}

            <div className="setup-footer-actions">
              {ui.setupStep < 3 ? (
                <button
                  type="button"
                  className="setup-outline-btn"
                  onClick={() => setSetupStep((ui.setupStep + 1) as 1 | 2 | 3)}
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                hasSchedule && (
                  <button
                    type="button"
                    className="setup-outline-btn"
                    onClick={() => onNavigate("weekly-schedule")}
                  >
                    View schedule
                    <ArrowRight size={16} />
                  </button>
                )
              )}
            </div>
          </footer>
        </div>

        <aside className="card setup-summary">
          <div className="setup-summary-header">
            <div className="setup-summary-icon">
              <ClipboardCheck size={20} strokeWidth={2.2} />
            </div>
            <h2>Summary</h2>
          </div>

          <div className="setup-summary-list">
            <div className="setup-summary-row">
              <div className="setup-summary-label">
                <Sun size={15} />
                <span>Wake</span>
              </div>
              <strong>{setup.wakeTime}</strong>
            </div>
            <div className="setup-summary-row">
              <div className="setup-summary-label">
                <Moon size={15} />
                <span>Sleep</span>
              </div>
              <strong>{setup.sleepTime}</strong>
            </div>
            <div className="setup-summary-row">
              <div className="setup-summary-label">
                <Users size={15} />
                <span>Activities</span>
              </div>
              <strong>{setup.selectedActivities.length}</strong>
            </div>
            <div className="setup-summary-row">
              <div className="setup-summary-label">
                <Clock3 size={15} />
                <span>Hours / week</span>
              </div>
              <strong>{estimatedHours}</strong>
            </div>
            <div className="setup-summary-row">
              <div className="setup-summary-label">
                <CalendarDays size={15} />
                <span>Fixed events</span>
              </div>
              <strong>{setup.fixedEvents.length}</strong>
            </div>
          </div>

          <div className="setup-summary-note">
            <Sparkles size={16} />
            <p>Saved in this browser automatically.</p>
          </div>
        </aside>
      </div>

      {showEventModal && (
        <FixedEventModal
          event={editingEvent}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onSave={saveEvent}
        />
      )}
    </div>
  );
}
