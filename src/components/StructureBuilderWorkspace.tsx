import { useEffect, useMemo, useState } from "react";
import { PortfolioNode, ValidationItem } from "../types";
import { StatusPill } from "./StatusPill";

interface StructureBuilderWorkspaceProps {
  root: PortfolioNode;
  selectedNodeId: string;
  selectedIds: string[];
  validationMap: Record<string, ValidationItem>;
  savedTemplates: Array<{ id: string; name: string }>;
  onSelect: (nodeId: string) => void;
  onToggleMultiSelect: (nodeId: string) => void;
  onClearSelection: () => void;
  onAddChild: (parentId: string, kind: "folder" | "file" | "multiFile") => void;
  onRenameNode: (nodeId: string, name: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleRequired: (nodeId: string) => void;
  onConvertNodeKind: (nodeId: string, kind: "folder" | "file" | "multiFile") => void;
  onMoveNode: (nodeId: string, targetParentId: string, targetIndex: number) => void;
  onNewEmpty: () => void;
  onResetToDefault: () => void;
  onImportTemplate: () => void;
  onLoadSavedTemplate: (templateId: string) => void;
  onExportTemplate: () => void;
  onSaveAsDefault: () => void;
  onBatchConvert: (kind: "folder" | "file" | "multiFile") => void;
  onBatchDelete: () => void;
  onBatchSetRequired: (required: boolean) => void;
  onBatchMoveToSelectedFolder: () => void;
}

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

export function StructureBuilderWorkspace(props: StructureBuilderWorkspaceProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoverDropKey, setHoverDropKey] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const selectedNode = useMemo(
    () => findNodeLocal(props.root, props.selectedNodeId) ?? props.root,
    [props.root, props.selectedNodeId],
  );

  const readiness = useMemo(() => {
    const values = Object.values(props.validationMap).filter((item) => item.status !== "optional");
    const complete = values.filter((item) => item.status === "complete").length;
    return values.length ? Math.round((complete / values.length) * 100) : 100;
  }, [props.validationMap]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [contextMenu]);

  const renderDropZone = (parentId: string, index: number) => {
    const dropKey = `${parentId}:${index}`;
    return (
      <div
        key={dropKey}
        className={`h-3 rounded-full transition ${
          hoverDropKey === dropKey ? "bg-slatebrand-300" : "bg-transparent"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setHoverDropKey(dropKey);
        }}
        onDragLeave={() => setHoverDropKey((current) => (current === dropKey ? null : current))}
        onDrop={(event) => {
          event.preventDefault();
          setHoverDropKey(null);
          const sourceId = event.dataTransfer.getData("text/plain") || draggedNodeId;
          if (sourceId) {
            props.onMoveNode(sourceId, parentId, index);
          }
        }}
      />
    );
  };

  const renderNode = (node: PortfolioNode, depth = 0, parentId?: string, index = 0) => {
    const validation = props.validationMap[node.id];
    const isSelected = node.id === props.selectedNodeId;
    const isChecked = props.selectedIds.includes(node.id);
    const isCollapsed = collapsed[node.id];
    const canHaveChildren = node.kind === "folder";

    return (
      <div key={node.id} className="space-y-2">
        {parentId ? renderDropZone(parentId, index) : null}
        <div
          className={`rounded-2xl border bg-white px-3 py-2 shadow-sm transition ${
            isSelected ? "border-slatebrand-400 bg-slatebrand-50" : "border-slate-200 hover:border-slatebrand-200"
          }`}
          style={{ marginLeft: depth * 18 }}
          draggable={node.id !== props.root.id}
          onDragStart={(event) => {
            setDraggedNodeId(node.id);
            event.dataTransfer.setData("text/plain", node.id);
          }}
          onDragEnd={() => {
            setDraggedNodeId(null);
            setHoverDropKey(null);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            props.onSelect(node.id);
            setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
          }}
          onDragOver={(event) => {
            if (!canHaveChildren) {
              return;
            }
            event.preventDefault();
            setHoverDropKey(`${node.id}:append`);
          }}
          onDrop={(event) => {
            if (!canHaveChildren) {
              return;
            }
            event.preventDefault();
            setHoverDropKey(null);
            const sourceId = event.dataTransfer.getData("text/plain") || draggedNodeId;
            if (sourceId) {
              props.onMoveNode(sourceId, node.id, node.children.length);
              setCollapsed((current) => ({ ...current, [node.id]: false }));
            }
          }}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={isChecked}
              onChange={() => props.onToggleMultiSelect(node.id)}
            />
            {canHaveChildren ? (
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                onClick={() => setCollapsed((current) => ({ ...current, [node.id]: !current[node.id] }))}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>
            ) : (
              <span className="px-2 text-slate-400">•</span>
            )}
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => props.onSelect(node.id)}>
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-900">{node.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {node.kind}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    node.required ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {node.required ? "required" : "optional"}
                </span>
              </div>
            </button>
            {validation ? <StatusPill status={validation.status} /> : null}
          </div>
          {hoverDropKey === `${node.id}:append` && canHaveChildren ? (
            <div className="mt-3 rounded-xl border border-dashed border-slatebrand-300 bg-slatebrand-100/60 px-3 py-2 text-xs text-slatebrand-800">
              Drop into this folder
            </div>
          ) : null}
        </div>
        {!isCollapsed && canHaveChildren && node.children.length > 0 ? (
          <div className="space-y-2">
            {node.children.map((child, childIndex) => renderNode(child, depth + 1, node.id, childIndex))}
            {renderDropZone(node.id, node.children.length)}
          </div>
        ) : null}
      </div>
    );
  };

  const convertLabelTarget =
    selectedNode.kind === "folder" ? "file" : selectedNode.kind === "file" ? "multiFile" : "folder";

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_380px]">
      <div className="panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="panel-title">Structure Builder</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Design the portfolio folder structure</h2>
          </div>
          <div className="rounded-2xl bg-slatebrand-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slatebrand-700">Readiness snapshot</div>
            <div className="mt-2 text-2xl font-semibold text-slatebrand-900">{readiness}%</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          Tip: use checkboxes for batch actions, drag onto folders to move, and right-click for quick commands.
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[auto_auto_auto_minmax(220px,1fr)_auto_auto]">
          <button type="button" className="btn-secondary" onClick={props.onNewEmpty}>New empty structure</button>
          <button type="button" className="btn-secondary" onClick={props.onResetToDefault}>Reset to latest default</button>
          <button type="button" className="btn-secondary" onClick={props.onImportTemplate}>Import template file</button>
          <select
            className="input-base"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                props.onLoadSavedTemplate(event.target.value);
                event.currentTarget.value = "";
              }
            }}
          >
            <option value="" disabled>Load saved template</option>
            {props.savedTemplates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={props.onExportTemplate}>Export structure as template</button>
          <button type="button" className="btn-secondary" onClick={props.onSaveAsDefault}>Save template as default</button>
        </div>

        {props.selectedIds.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slatebrand-50 p-3">
            <span className="self-center text-sm font-medium text-slatebrand-900">{props.selectedIds.length} selected</span>
            <button type="button" className="btn-secondary" onClick={() => props.onBatchConvert("folder")}>To folder</button>
            <button type="button" className="btn-secondary" onClick={() => props.onBatchConvert("file")}>To single file</button>
            <button type="button" className="btn-secondary" onClick={() => props.onBatchConvert("multiFile")}>To multifile</button>
            <button type="button" className="btn-secondary" onClick={() => props.onBatchSetRequired(true)}>Mark required</button>
            <button type="button" className="btn-secondary" onClick={() => props.onBatchSetRequired(false)}>Mark optional</button>
            <button type="button" className="btn-secondary" onClick={props.onBatchMoveToSelectedFolder}>Move to selected folder</button>
            <button type="button" className="btn-secondary border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800" onClick={props.onBatchDelete}>Delete selected</button>
            <button type="button" className="btn-secondary" onClick={props.onClearSelection}>Clear</button>
          </div>
        ) : null}

        <div className="mt-4 max-h-[70vh] overflow-auto pr-2">{renderNode(props.root)}</div>
      </div>

      <aside className="panel p-4">
        <div className="panel-title">Selected Item</div>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedNode.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill status={props.validationMap[selectedNode.id]?.status ?? "optional"} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selectedNode.kind}</span>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input className="input-base" value={selectedNode.name} onChange={(event) => props.onRenameNode(selectedNode.id, event.target.value)} />
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Requirement level</span>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-sm font-medium ${selectedNode.required ? "bg-slatebrand-800 text-white" : "bg-slate-200 text-slate-700"}`}
                onClick={() => props.onToggleRequired(selectedNode.id)}
              >
                {selectedNode.required ? "Required" : "Optional"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Item type</span>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" disabled={selectedNode.id === props.root.id} onClick={() => props.onConvertNodeKind(selectedNode.id, "folder")}>Folder</button>
                <button type="button" className="btn-secondary" disabled={selectedNode.id === props.root.id} onClick={() => props.onConvertNodeKind(selectedNode.id, "file")}>Single file</button>
                <button type="button" className="btn-secondary" disabled={selectedNode.id === props.root.id} onClick={() => props.onConvertNodeKind(selectedNode.id, "multiFile")}>Multifile</button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <button type="button" className="btn-secondary" onClick={() => props.onAddChild(selectedNode.id, "folder")}>Add child folder</button>
            <button type="button" className="btn-secondary" onClick={() => props.onAddChild(selectedNode.id, "file")} disabled={selectedNode.kind !== "folder"}>Add single file</button>
            <button type="button" className="btn-secondary" onClick={() => props.onAddChild(selectedNode.id, "multiFile")} disabled={selectedNode.kind !== "folder"}>Add multifile</button>
            <button type="button" className="btn-secondary" onClick={() => props.onDuplicateNode(selectedNode.id)}>Duplicate item</button>
            <button type="button" className="btn-secondary border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800" onClick={() => props.onDeleteNode(selectedNode.id)} disabled={selectedNode.id === props.root.id}>Delete item</button>
          </div>
        </div>
      </aside>

      {contextMenu ? (
        <div className="fixed z-50 min-w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(event) => event.stopPropagation()}>
          <ContextAction label="Rename" onClick={() => { props.onSelect(contextMenu.nodeId); setContextMenu(null); }} />
          <ContextAction label="Add folder" onClick={() => { props.onAddChild(contextMenu.nodeId, "folder"); setContextMenu(null); }} />
          <ContextAction label="Add single file" onClick={() => { props.onAddChild(contextMenu.nodeId, "file"); setContextMenu(null); }} />
          <ContextAction label="Add multifile" onClick={() => { props.onAddChild(contextMenu.nodeId, "multiFile"); setContextMenu(null); }} />
          <ContextAction label="Duplicate" onClick={() => { props.onDuplicateNode(contextMenu.nodeId); setContextMenu(null); }} />
          <ContextAction label="Toggle required" onClick={() => { props.onToggleRequired(contextMenu.nodeId); setContextMenu(null); }} />
          <ContextAction label="Convert to folder" onClick={() => { props.onConvertNodeKind(contextMenu.nodeId, "folder"); setContextMenu(null); }} />
          <ContextAction label="Convert to single file" onClick={() => { props.onConvertNodeKind(contextMenu.nodeId, "file"); setContextMenu(null); }} />
          <ContextAction label="Convert to multifile" onClick={() => { props.onConvertNodeKind(contextMenu.nodeId, "multiFile"); setContextMenu(null); }} />
          <ContextAction label="Delete" destructive onClick={() => { props.onDeleteNode(contextMenu.nodeId); setContextMenu(null); }} />
        </div>
      ) : null}
    </section>
  );
}

function ContextAction({ label, onClick, destructive = false }: { label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button type="button" className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${destructive ? "text-rose-700 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"}`} onClick={onClick}>
      {label}
    </button>
  );
}

function findNodeLocal(node: PortfolioNode, id: string): PortfolioNode | null {
  if (node.id === id) {
    return node;
  }
  for (const child of node.children) {
    const found = findNodeLocal(child, id);
    if (found) {
      return found;
    }
  }
  return null;
}
