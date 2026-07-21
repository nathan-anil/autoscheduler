import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  Dumbbell,
  Trash2,
  Utensils,
  Waves,
  X,
} from "lucide-react";

import type { BlockCategory } from "./types";
import {
  dayNames,
  formatPreviewRange,
  formatTime12h,
  timeOptions,
  timeToMinutes,
} from "./lib/time";
import "./EditScheduleBlockModal.css";

export type EditableBlock = {
  id: string;
  day: number;
  start: number;
  end: number;
  label: string;
  category: BlockCategory;
};

type EditScheduleBlockModalProps = {
  block: EditableBlock;
  onClose: () => void;
  onSave: (block: EditableBlock) => string | null;
  onDelete: (id: string) => void;
};

const categoryIcons: Record<BlockCategory, LucideIcon> = {
  fixed: CalendarDays,
  study: BookOpen,
  fitness: Dumbbell,
  meal: Utensils,
  relaxation: Waves,
  free: Clock3,
};

function blockTypeLabel(category: BlockCategory) {
  return category === "fixed" ? "Fixed" : "Activity";
}

export default function EditScheduleBlockModal({
  block,
  onClose,
  onSave,
  onDelete,
}: EditScheduleBlockModalProps) {
  const [title, setTitle] = useState(block.label);
  const [day, setDay] = useState(block.day);
  const [startTime, setStartTime] = useState(formatTime12h(block.start));
  const [endTime, setEndTime] = useState(formatTime12h(block.end));
  const [error, setError] = useState<string | null>(null);

  const PreviewIcon = categoryIcons[block.category];
  const typeLabel = blockTypeLabel(block.category);

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const previewValid =
    startMinutes !== null && endMinutes !== null && endMinutes > startMinutes;

  function handleSave() {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start === null || end === null) {
      setError("Choose valid start and end times.");
      return;
    }
    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    const saveError = onSave({
      ...block,
      label: title.trim() || block.label,
      day,
      start,
      end,
    });

    if (saveError) {
      setError(saveError);
      return;
    }

    onClose();
  }

  function handleDelete() {
    onDelete(block.id);
    onClose();
  }

  return (
    <div className="edit-block-overlay" onClick={onClose}>
      <div
        className="edit-block-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-block-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-block-header">
          <div>
            <h2 id="edit-block-heading">Edit block</h2>
            <p>Change it or delete it.</p>
            <span className="edit-block-type-badge">
              <CalendarDays size={13} />
              {typeLabel}
            </span>
          </div>
          <button
            type="button"
            className="edit-block-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="edit-block-form">
          <label className="edit-block-field">
            <span>Block Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="edit-block-field">
            <span>Day</span>
            <div className="edit-block-select-wrap">
              <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {dayNames.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </label>

          <div className="edit-block-time-row">
            <label className="edit-block-field">
              <span>Start Time</span>
              <div className="edit-block-select-wrap">
                <Clock3 size={15} />
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setError(null);
                  }}
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

            <label className="edit-block-field">
              <span>End Time</span>
              <div className="edit-block-select-wrap">
                <Clock3 size={15} />
                <select
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setError(null);
                  }}
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

          {error && <p className="edit-block-error">{error}</p>}
        </div>

        <div className="edit-block-preview">
          <span className="edit-block-preview-label">Preview</span>
          <div className={`edit-block-preview-card ${block.category}`}>
            <div className={`edit-block-preview-icon ${block.category}`}>
              <PreviewIcon size={18} strokeWidth={2} />
            </div>
            <div className="edit-block-preview-content">
              <strong>{title.trim() || block.label}</strong>
              <span>
                {previewValid
                  ? formatPreviewRange(day, startMinutes, endMinutes)
                  : "Invalid time range"}
              </span>
              <span className="edit-block-type-badge small">
                <CalendarDays size={11} />
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="edit-block-footer">
          <button
            type="button"
            className="edit-block-delete"
            onClick={handleDelete}
          >
            <Trash2 size={15} />
            Delete Block
          </button>

          <div className="edit-block-footer-actions">
            <button type="button" className="edit-block-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="edit-block-save" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
