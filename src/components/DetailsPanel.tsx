import { PortfolioMetadata, PortfolioNode, UploadedFileRecord, ValidationItem } from "../types";
import { buildExportFilename } from "../utils/naming";
import { StatusPill } from "./StatusPill";

interface DetailsPanelProps {
  node: PortfolioNode;
  files: UploadedFileRecord[];
  metadata: PortfolioMetadata;
  validation?: ValidationItem;
  onRenameNode: (name: string) => void;
  onSetRequired: (required: boolean) => void;
  onAddChild: (kind: "folder" | "file" | "multiFile") => void;
  onDuplicateNode: () => void;
  onDeleteNode: () => void;
}

export function DetailsPanel({
  node,
  files,
  metadata,
  validation,
  onRenameNode,
  onSetRequired,
  onAddChild,
  onDuplicateNode,
  onDeleteNode,
}: DetailsPanelProps) {
  return (
    <aside className="panel flex h-full flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="panel-title">Details</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{node.name}</h2>
        </div>
        {validation && <StatusPill status={validation.status} />}
      </div>

      <div className="space-y-5 overflow-auto pr-1">
        <section className="rounded-2xl bg-slate-50 p-4">
          <label className="field-label">Folder name</label>
          <input
            className="input-base"
            value={node.name}
            onChange={(event) => onRenameNode(event.target.value)}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-700">Required item</span>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                node.required ? "bg-slatebrand-800 text-white" : "bg-slate-200 text-slate-700"
              }`}
              onClick={() => onSetRequired(!node.required)}
            >
              {node.required ? "Required" : "Optional"}
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn-secondary" onClick={() => onAddChild("folder")}>
              Add folder
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onAddChild("file")}
            >
              Add single file
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onAddChild("multiFile")}
            >
              Add multifile
            </button>
            <button type="button" className="btn-secondary" onClick={onDuplicateNode}>
              Duplicate
            </button>
            <button
              type="button"
              className="btn-secondary border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800"
              onClick={onDeleteNode}
            >
              Delete
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Validation guidance</h3>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {validation?.guidance.length ? (
              validation.guidance.map((message) => (
                <div key={message} className="rounded-xl bg-slate-50 p-3">
                  {message}
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-slate-50 p-3">This section is ready.</div>
            )}
            {validation?.missingRequired.length ? (
              <div className="rounded-xl bg-rose-50 p-3 text-rose-800">
                Missing: {validation.missingRequired.join(", ")}
              </div>
            ) : null}
            {validation?.optionalMissing.length ? (
              <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
                Optional: {validation.optionalMissing.join(", ")}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Suggested export names</h3>
          <div className="mt-3 space-y-2">
            {files.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                Upload files to preview standardized names.
              </div>
            )}
            {files.map((file) => (
              <div key={file.id} className="rounded-xl bg-slate-50 p-3">
                <p className="truncate text-sm font-medium text-slate-900">{file.originalName}</p>
                <p className="mt-1 truncate text-xs text-slate-600">
                  {buildExportFilename(metadata, node, file)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
