import { ValidationItem } from "../types";
import { StatusPill } from "./StatusPill";

interface ReadinessModalProps {
  open: boolean;
  readiness: number;
  completed: ValidationItem[];
  missing: ValidationItem[];
  partial: ValidationItem[];
  optionalMissing: ValidationItem[];
  overrideEnabled: boolean;
  overrideExplanation: string;
  setOverrideEnabled: (value: boolean) => void;
  setOverrideExplanation: (value: string) => void;
  onClose: () => void;
  onExportZip: () => void;
  onExportFolder: () => void;
  folderExportSupported: boolean;
}

export function ReadinessModal(props: ReadinessModalProps) {
  if (!props.open) {
    return null;
  }

  const blocked = props.missing.length > 0 && (!props.overrideEnabled || !props.overrideExplanation.trim());

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
        <div className="panel max-h-[92vh] w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <div className="panel-title">Readiness Summary</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{props.readiness}% ready</h2>
            </div>
            <button type="button" className="btn-secondary" onClick={props.onClose}>
              Close
            </button>
          </div>
          <div className="grid max-h-[calc(92vh-96px)] gap-4 overflow-auto p-6 lg:grid-cols-2">
            <section className="space-y-4">
              <SummaryCard title="Completed items" items={props.completed} empty="Nothing complete yet." />
              <SummaryCard title="Partially completed" items={props.partial} empty="No partial items." />
            </section>
            <section className="space-y-4">
              <SummaryCard title="Missing required" items={props.missing} empty="No blocking gaps." />
              <SummaryCard title="Optional missing" items={props.optionalMissing} empty="No optional gaps." />
            </section>
            <section className="rounded-2xl border border-slate-200 p-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Override missing required items</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Use only when you need an export despite unresolved required items.
                  </p>
                </div>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    props.overrideEnabled
                      ? "bg-amber-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                  onClick={() => props.setOverrideEnabled(!props.overrideEnabled)}
                >
                  {props.overrideEnabled ? "Override enabled" : "Enable override"}
                </button>
              </div>
              <textarea
                className="input-base mt-4 min-h-28"
                placeholder="Document why export is still justified and what follow-up action is planned."
                value={props.overrideExplanation}
                onChange={(event) => props.setOverrideExplanation(event.target.value)}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={blocked}
                  onClick={props.onExportZip}
                >
                  Export ZIP
                </button>
                <button
                  type="button"
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={blocked || !props.folderExportSupported}
                  onClick={props.onExportFolder}
                >
                  Write to folder
                </button>
                {blocked && (
                  <span className="self-center text-sm text-rose-700">
                    Export is blocked until required gaps are resolved or override is justified.
                  </span>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  items,
  empty,
}: {
  title: string;
  items: ValidationItem[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">{empty}</div>}
        {items.map((item) => (
          <div key={item.nodeId} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{item.nodeName}</span>
              <StatusPill status={item.status} />
            </div>
            {!!item.missingRequired.length && (
              <p className="mt-2 text-sm text-rose-700">Missing: {item.missingRequired.join(", ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
