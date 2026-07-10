import { useState } from "react";
import { ChevronDown, Clock3, X } from "lucide-react";

import type { FixedEvent } from "../types";
import {
  dayNames,
  formatPreviewRange,
  formatTime12h,
  timeOptions,
  timeToMinutes,
} from "../lib/time";
import "./FixedEventModal.css";

type Props = {
  event?: FixedEvent | null;
  onClose: () => void;
  onSave: (event: Omit<FixedEvent, "id"> & { id?: string }) => void;
};

export default function FixedEventModal({ event, onClose, onSave }: Props) {
  const [label, setLabel] = useState(event?.label ?? "");
  const [day, setDay] = useState(event?.day ?? 0);
  const [startTime, setStartTime] = useState(
    formatTime12h(event?.start ?? 120),
  );
  const [endTime, setEndTime] = useState(formatTime12h(event?.end ?? 210));

  function handleSave() {
    onSave({
      id: event?.id,
      label: label.trim() || "Event",
      day,
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    });
    onClose();
  }

  return (
    <div className="fixed-event-overlay" onClick={onClose}>
      <div
        className="fixed-event-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fixed-event-header">
          <div>
            <h2>{event ? "Edit event" : "New event"}</h2>
          </div>
          <button
            type="button"
            className="fixed-event-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="fixed-event-form">
          <label className="fixed-event-field">
            <span>Name</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Class, work..."
            />
          </label>

          <label className="fixed-event-field">
            <span>Day</span>
            <div className="fixed-event-select-wrap">
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {dayNames.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </label>

          <div className="fixed-event-time-row">
            <label className="fixed-event-field">
              <span>Start</span>
              <div className="fixed-event-select-wrap">
                <Clock3 size={15} />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {timeOptions.map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </label>

            <label className="fixed-event-field">
              <span>End</span>
              <div className="fixed-event-select-wrap">
                <Clock3 size={15} />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeOptions.map((time) => (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </label>
          </div>
        </div>

        <div className="fixed-event-preview">
          <strong>
            {formatPreviewRange(
              day,
              timeToMinutes(startTime),
              timeToMinutes(endTime),
            )}
          </strong>
          <p>{label.trim() || "Event"}</p>
        </div>

        <div className="fixed-event-footer">
          <button type="button" className="fixed-event-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="fixed-event-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
