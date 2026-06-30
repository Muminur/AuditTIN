"use client";

import { useRef, useId } from "react";
import { cn } from "@/lib/utils";

export type TinStatus = "idle" | "selected" | "not_selected" | "error" | "busy";

interface TinInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  status?: TinStatus;
  label: string;
  describedById?: string;
}

const LEN = 12;

/**
 * 12-cell segmented TIN input — the signature of the verification terminal.
 * Full keyboard operation: type, paste (distributes digits), ←/→ to move,
 * Backspace/Delete to clear. Numeric-only, no autocomplete (privacy).
 */
export function TinInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  status = "idle",
  label,
  describedById,
}: TinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const groupId = useId();

  const digits = value.replace(/\D/g, "").slice(0, LEN);
  const cells = Array.from({ length: LEN }, (_, i) => digits[i] ?? "");

  function emit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, LEN);
    onChange(clean);
    if (clean.length === LEN) onComplete?.(clean);
  }

  function focusCell(i: number) {
    const idx = Math.max(0, Math.min(LEN - 1, i));
    const el = refs.current[idx];
    el?.focus();
    el?.select();
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const typed = e.target.value.replace(/\D/g, "");
    if (!typed) return; // deletions handled in keydown
    const arr = cells.slice();
    let j = i;
    for (const ch of typed) {
      if (j > LEN - 1) break;
      arr[j] = ch;
      j++;
    }
    emit(arr.join(""));
    focusCell(j);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = cells.slice();
      if (arr[i]) {
        arr[i] = "";
        emit(arr.join(""));
        focusCell(i);
      } else if (i > 0) {
        arr[i - 1] = "";
        emit(arr.join(""));
        focusCell(i - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      const arr = cells.slice();
      arr[i] = "";
      emit(arr.join(""));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCell(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCell(i + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, LEN);
    if (text) {
      emit(text);
      focusCell(Math.min(text.length, LEN - 1));
    }
  }

  const cellStatus = (filled: boolean) => {
    if (status === "selected") return "border-stamp/70 text-stamp";
    if (status === "not_selected") return "border-jade/70 text-jade";
    if (status === "error") return "border-red-400/70 text-red-300";
    return filled
      ? "border-jade/60 text-paper"
      : "border-line text-paper focus:border-jade";
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedById}
      className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
    >
      {cells.map((ch, i) => (
        <span key={`${groupId}-${i}`} className="contents">
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={1}
            value={ch}
            disabled={disabled}
            aria-label={`${label} — digit ${i + 1} of ${LEN}`}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              "h-12 w-9 rounded-md border bg-ink-2/70 text-center font-mono text-lg font-medium tabular-nums shadow-inner outline-none transition-colors sm:h-14 sm:w-11 sm:text-xl",
              cellStatus(Boolean(ch)),
              disabled && "opacity-60",
            )}
          />
          {/* Visual 4-4-4 grouping separators. */}
          {(i === 3 || i === 7) && (
            <span aria-hidden className="mx-0.5 text-mute sm:mx-1">
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
