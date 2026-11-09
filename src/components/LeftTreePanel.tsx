import { useMemo, useState } from "react";
import { PortfolioNode, ValidationItem } from "../types";
import { StatusPill } from "./StatusPill";

interface LeftTreePanelProps {
  root: PortfolioNode;
  selectedNodeId: string;
  validationMap: Record<string, ValidationItem>;
  onSelect: (nodeId: string) => void;
  onMove: (parentId: string, sourceIndex: number, targetIndex: number) => void;
}

export function LeftTreePanel({
  root,
  selectedNodeId,
  validationMap,
  onSelect,
  onMove,
}: LeftTreePanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const progress = useMemo(() => {
    const values = Object.values(validationMap).filter((item) => item.status !== "optional");
    const complete = values.filter((item) => item.status === "complete").length;
    return values.length ? Math.round((complete / values.length) * 100) : 100;
  }, [validationMap]);

  const renderNode = (node: PortfolioNode, parentId?: string, index = 0) => {
    const validation = validationMap[node.id];
    const isCollapsed = collapsed[node.id];
    const isSelected = node.id === selectedNodeId;
    const canCollapse = node.children.length > 0;

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={`rounded-xl border px-3 py-2 transition ${
            isSelected
              ? "border-slatebrand-300 bg-slatebrand-50"
              : "border-transparent hover:border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-left text-sm font-medium text-slate-800"
              onClick={() => onSelect(node.id)}
            >
              {node.name}
            </button>
            <div className="ml-auto flex items-center gap-2">
              {parentId && (
                <>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    onClick={() => index > 0 && onMove(parentId, index, index - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    onClick={() => onMove(parentId, index, index + 1)}
                  >
                    ↓
                  </button>
                </>
              )}
              {validation && <StatusPill status={validation.status} />}
              {canCollapse && (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                  onClick={() =>
                    setCollapsed((current) => ({ ...current, [node.id]: !current[node.id] }))
                  }
                >
                  {isCollapsed ? "+" : "–"}
                </button>
              )}
            </div>
          </div>
        </div>
        {!isCollapsed && node.children.length > 0 && (
          <div className="ml-4 space-y-2 border-l border-dashed border-slate-200 pl-4">
            {node.children.map((child, childIndex) => renderNode(child, node.id, childIndex))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="panel flex h-full flex-col p-4">
      <div className="mb-4">
        <div className="panel-title">Portfolio Map</div>
        <div className="mt-3 rounded-2xl bg-slatebrand-50 p-3">
          <div className="flex items-center justify-between text-sm text-slatebrand-800">
            <span>Readiness progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slatebrand-100">
            <div
              className="h-2 rounded-full bg-slatebrand-700 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto pr-1">{renderNode(root)}</div>
    </aside>
  );
}
