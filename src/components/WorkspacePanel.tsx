import { ChangeEvent, DragEvent, useMemo } from "react";
import { PortfolioNode, UploadedFileRecord, ValidationItem } from "../types";
import { StatusPill } from "./StatusPill";

interface WorkspacePanelProps {
  node: PortfolioNode;
  files: UploadedFileRecord[];
  validation?: ValidationItem;
  onFilesAdded: (files: FileList | File[]) => void;
  onRemoveFile: (fileId: string) => void;
  onRoleChange: (fileId: string, role: string) => void;
  availableRoles: string[];
}

export function WorkspacePanel({
  node,
  files,
  validation,
  onFilesAdded,
  onRemoveFile,
  onRoleChange,
  availableRoles,
}: WorkspacePanelProps) {
  const previewable = useMemo(
    () => files.filter((file) => file.file.type.startsWith("image/") && file.previewUrl),
    [files],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files?.length) {
      onFilesAdded(event.dataTransfer.files);
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      onFilesAdded(event.target.files);
      event.target.value = "";
    }
  };

  return (
    <section className="panel flex h-full flex-col p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <div className="panel-title">Workspace</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{node.name}</h2>
        </div>
        {validation && (
          <div className="ml-auto">
            <StatusPill status={validation.status} label={`Ready ${Math.round(validation.completionRatio * 100)}%`} />
          </div>
        )}
      </div>

      <div
        className="rounded-3xl border-2 border-dashed border-slatebrand-200 bg-slatebrand-50/70 p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <p className="text-base font-semibold text-slatebrand-900">Drop files here</p>
        <p className="mt-2 text-sm text-slatebrand-700">
          Keep originals untouched. We only create renamed copies during export.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          {node.renameBehavior === "preserve" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
              Export keeps original filenames
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Export uses standardized naming
            </span>
          )}
          {typeof node.maxFiles === "number" ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
              Expected files: {node.maxFiles}
            </span>
          ) : node.allowMultipleFiles ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              Multiple files allowed
            </span>
          ) : null}
        </div>
        <label className="btn-primary mt-4 cursor-pointer">
          Select files
          <input
            type="file"
            multiple={node.allowMultipleFiles || typeof node.maxFiles !== "number" || node.maxFiles > 1}
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>

      <div className="mt-5 grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-0 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Uploaded files</h3>
            <span className="text-xs text-slate-500">{files.length} item(s)</span>
          </div>
          <div className="max-h-[420px] space-y-3 overflow-auto p-4">
            {files.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No files yet. Upload into this section to begin validation.
              </div>
            )}
            {files.map((file) => (
              <div key={file.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{file.originalName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.file.type || "Unknown type"} · {Math.round(file.file.size / 1024)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    onClick={() => onRemoveFile(file.id)}
                  >
                    Remove
                  </button>
                </div>
                {availableRoles.length > 1 ? (
                  <div className="mt-3">
                    <label className="field-label">Role</label>
                    <select
                      className="input-base"
                      value={file.role}
                      onChange={(event) => onRoleChange(file.id, event.target.value)}
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                    File type: {availableRoles[0] ?? "Document"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
          </div>
          <div className="max-h-[420px] overflow-auto p-4">
            {previewable.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Image previews appear here when available.
              </div>
            )}
            <div className="space-y-4">
              {previewable.map((file) => (
                <div key={file.id} className="overflow-hidden rounded-2xl border border-slate-200">
                  <img src={file.previewUrl} alt={file.originalName} className="h-48 w-full object-cover" />
                  <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
                    {file.originalName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
