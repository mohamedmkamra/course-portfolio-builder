import { ValidationStatus } from "../types";

const statusStyles: Record<ValidationStatus, string> = {
  complete: "bg-emerald-100 text-emerald-700",
  missing: "bg-rose-100 text-rose-700",
  partial: "bg-amber-100 text-amber-700",
  optional: "bg-slate-100 text-slate-600",
};

const statusIcons: Record<ValidationStatus, string> = {
  complete: "✅",
  missing: "❌",
  partial: "⚠️",
  optional: "❓",
};

interface StatusPillProps {
  status: ValidationStatus;
  label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={`status-badge ${statusStyles[status]}`}>
      <span>{statusIcons[status]}</span>
      <span>{label ?? status}</span>
    </span>
  );
}
