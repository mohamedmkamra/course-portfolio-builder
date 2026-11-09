import { useEffect, useMemo, useRef, useState } from "react";
import { createDefaultTemplate, defaultMetadata } from "./data/defaultTemplate";
import { DetailsPanel } from "./components/DetailsPanel";
import { LeftTreePanel } from "./components/LeftTreePanel";
import { ReadinessModal } from "./components/ReadinessModal";
import { StructureBuilderWorkspace } from "./components/StructureBuilderWorkspace";
import { WorkspacePanel } from "./components/WorkspacePanel";
import { PortfolioMetadata, PortfolioNode, TemplateDefinition, UploadedFileRecord } from "./types";
import { createId } from "./utils/id";
import { cloneFileRecordForStorage, loadDefaultTemplate, loadSnapshot, loadTemplates, saveDefaultTemplate, saveSnapshot, saveTemplate } from "./utils/storage";
import { createExportArtifacts, downloadZip, writeArtifactsToDirectory } from "./utils/export";
import { getAvailableRoles, getDefaultRoleForNode, summarizeValidation, validateTree } from "./utils/validation";
import { cloneNode, duplicateNode, findNode, insertChild, moveNodeWithinParent, removeNodeFromTree, updateNodeInTree } from "./utils/tree";
import { extractNodeFromTree, findParentNode, insertChildAtIndex, isDescendantNode } from "./utils/tree";
import { saveAs } from "file-saver";

type WorkspaceMode = "builder" | "populate";

function App() {
  const initialTemplate = useMemo(() => createDefaultTemplate(), []);
  const [root, setRoot] = useState<PortfolioNode>(initialTemplate.root);
  const [metadata, setMetadata] = useState<PortfolioMetadata>({
    ...defaultMetadata,
    ...initialTemplate.metadataDefaults,
  });
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState(initialTemplate.root.id);
  const [savedTemplates, setSavedTemplates] = useState<TemplateDefinition[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideExplanation, setOverrideExplanation] = useState("");
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Autosave active.");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("builder");
  const importTemplateInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const selectedNode = findNode(root, selectedNodeId) ?? root;
  const validationMap = useMemo(() => validateTree(root, files), [root, files]);
  const validationSummary = useMemo(
    () => summarizeValidation(Object.values(validationMap)),
    [validationMap],
  );

  useEffect(() => {
    void loadTemplates().then(setSavedTemplates).catch(() => undefined);
    void Promise.all([loadDefaultTemplate(), loadSnapshot()])
      .then(([defaultTemplate, snapshot]) => {
        if (snapshot) {
          setRoot(snapshot.root);
          setMetadata(snapshot.metadata);
          setFiles(
            snapshot.files.map((file) => ({
              ...file,
              previewUrl: file.file.type.startsWith("image/") ? URL.createObjectURL(file.file) : undefined,
            })),
          );
          setSelectedNodeId(snapshot.selectedNodeId);
          setStatusMessage(`Recovered autosaved session from ${new Date(snapshot.savedAt).toLocaleString()}.`);
          return;
        }

        if (defaultTemplate) {
          const clonedRoot = cloneNode(defaultTemplate.root);
          setRoot(clonedRoot);
          setMetadata({ ...defaultMetadata, ...defaultTemplate.metadataDefaults });
          setSelectedNodeId(clonedRoot.id);
          setStatusMessage(`Loaded your saved default template "${defaultTemplate.name}".`);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void saveSnapshot({
        root,
        metadata,
        files: files.map(cloneFileRecordForStorage),
        selectedNodeId,
        savedAt: new Date().toISOString(),
      })
        .then(() => setStatusMessage("Autosaved just now."))
        .catch(() => setStatusMessage("Autosave unavailable in this browser."));
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [root, metadata, files, selectedNodeId]);

  const handleFilesAdded = (inputFiles: FileList | File[]) => {
    const nextFiles = Array.from(inputFiles).map((file) => ({
      id: createId(),
      nodeId: selectedNode.id,
      file,
      role: getDefaultRoleForNode(selectedNode),
      originalName: file.name,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      uploadedAt: new Date().toISOString(),
    }));

    setFiles((current) => [...current, ...nextFiles]);
  };

  const updateSelectedNode = (updater: (node: PortfolioNode) => PortfolioNode) => {
    setRoot((current) => updateNodeInTree(current, selectedNode.id, updater));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === root.id) {
      return;
    }

    const node = findNode(root, nodeId);
    if (!node) {
      return;
    }

    if (!window.confirm(`Delete "${node.name}" and its uploaded files from this working session?`)) {
      return;
    }

    const nodeIdsToRemove = collectNodeIds(node);
    setRoot((current) => removeNodeFromTree(current, nodeId));
    setFiles((current) => current.filter((file) => !nodeIdsToRemove.has(file.nodeId)));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(root.id);
    }
    setStatusMessage(`Removed "${node.name}" from the structure.`);
  };

  const handleMoveNode = (nodeId: string, targetParentId: string, targetIndex: number) => {
    if (nodeId === root.id || nodeId === targetParentId) {
      return;
    }

    const draggedNode = findNode(root, nodeId);
    const targetParent = findNode(root, targetParentId);
    if (!draggedNode || !targetParent || targetParent.kind !== "folder") {
      return;
    }

    if (isDescendantNode(draggedNode, targetParentId)) {
      return;
    }

    setRoot((current) => {
      const sourceParent = findParentNode(current, nodeId);
      if (!sourceParent) {
        return current;
      }

      const sourceIndex = sourceParent.children.findIndex((child) => child.id === nodeId);
      const { tree: extractedTree, extracted } = extractNodeFromTree(current, nodeId);
      if (!extracted) {
        return current;
      }

      let nextIndex = targetIndex;
      if (sourceParent.id === targetParentId && sourceIndex < targetIndex) {
        nextIndex -= 1;
      }

      return insertChildAtIndex(extractedTree, targetParentId, extracted, nextIndex);
    });
    setStatusMessage(`Moved "${draggedNode.name}".`);
  };

  const handleConvertNodeKind = (nodeId: string, kind: "folder" | "file" | "multiFile") => {
    if (nodeId === root.id) {
      return;
    }

    const node = findNode(root, nodeId);
    if (!node || node.kind === kind) {
      return;
    }

    if (
      (kind === "file" || kind === "multiFile") &&
      node.children.length > 0 &&
      !window.confirm(`Convert "${node.name}" to ${kind} and remove its child items?`)
    ) {
      return;
    }

    setRoot((current) =>
      updateNodeInTree(current, nodeId, (target) => ({
        ...target,
        kind,
        children: kind === "folder" ? target.children : [],
        allowMultipleFiles: kind === "multiFile" ? true : undefined,
        maxFiles: kind === "file" ? target.maxFiles ?? 1 : undefined,
        renameBehavior: kind === "folder" ? undefined : target.renameBehavior ?? "standardize",
      })),
    );
    setStatusMessage(`Converted "${node.name}" to ${kind}.`);
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim() || `${metadata.courseCode || "Course"} Template`;
    const template: TemplateDefinition = {
      id: createId(),
      name,
      root: cloneNode(root),
      metadataDefaults: metadata,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveTemplate(template);
      const nextTemplates = await loadTemplates();
      setSavedTemplates(nextTemplates);
      setStatusMessage(`Saved template "${name}".`);
    } catch {
      setStatusMessage("Template save failed in this browser.");
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = savedTemplates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    const clonedRoot = cloneNode(template.root);
    setRoot(clonedRoot);
    setMetadata({ ...defaultMetadata, ...template.metadataDefaults });
    setSelectedNodeId(clonedRoot.id);
    setFiles([]);
    setStatusMessage(`Loaded template "${template.name}".`);
  };

  const handleNewEmptyStructure = () => {
    const emptyRoot: PortfolioNode = {
      id: createId(),
      name: "Course Portfolio",
      kind: "folder",
      required: true,
      children: [],
    };

    setRoot(emptyRoot);
    setSelectedNodeId(emptyRoot.id);
    setFiles([]);
    setStatusMessage("Started a new empty structure.");
  };

  const handleResetToLatestDefault = () => {
    if (!window.confirm("Replace the current working structure with the latest default template?")) {
      return;
    }

    const latestDefault = createDefaultTemplate();
    setRoot(latestDefault.root);
    setMetadata({
      ...defaultMetadata,
      ...latestDefault.metadataDefaults,
    });
    setSelectedNodeId(latestDefault.root.id);
    setFiles([]);
    setSelectedNodeIds([]);
    setStatusMessage("Reset to the latest default template.");
  };

  const handleImportTemplateFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<TemplateDefinition>;
      if (!parsed.root || !parsed.root.id || !parsed.root.name) {
        throw new Error("Invalid template file.");
      }

      const clonedRoot = cloneNode(parsed.root);
      setRoot(clonedRoot);
      setSelectedNodeId(clonedRoot.id);
      setFiles([]);
      setSelectedNodeIds([]);
      if (parsed.metadataDefaults) {
        setMetadata((current) => ({ ...current, ...parsed.metadataDefaults }));
      }
      setStatusMessage(`Imported template from "${file.name}".`);
    } catch {
      setStatusMessage("Template import failed. Please use a valid JSON template file.");
    }
  };

  const handleExportTemplate = () => {
    const template: TemplateDefinition = {
      id: createId(),
      name: templateName.trim() || `${metadata.courseCode || "Course"} Template`,
      root: cloneNode(root),
      metadataDefaults: metadata,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    saveAs(blob, `${template.name.replace(/\s+/g, "_")}.json`);
    setStatusMessage(`Exported template "${template.name}".`);
  };

  const handleSaveAsDefault = async () => {
    const template: TemplateDefinition = {
      id: createId(),
      name: templateName.trim() || `${metadata.courseCode || "Course"} Default`,
      root: cloneNode(root),
      metadataDefaults: metadata,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveDefaultTemplate(template);
      setStatusMessage(`Saved "${template.name}" as your default template.`);
    } catch {
      setStatusMessage("Could not save the default template.");
    }
  };

  const handleToggleMultiSelect = (nodeId: string) => {
    setSelectedNodeIds((current) =>
      current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId],
    );
  };

  const handleBatchConvert = (kind: "folder" | "file" | "multiFile") => {
    selectedNodeIds.forEach((nodeId) => handleConvertNodeKind(nodeId, kind));
    setSelectedNodeIds([]);
  };

  const handleBatchDelete = () => {
    [...selectedNodeIds].forEach((nodeId) => handleDeleteNode(nodeId));
    setSelectedNodeIds([]);
  };

  const handleBatchSetRequired = (required: boolean) => {
    setRoot((current) =>
      selectedNodeIds.reduce(
        (tree, nodeId) => updateNodeInTree(tree, nodeId, (node) => ({ ...node, required })),
        current,
      ),
    );
    setSelectedNodeIds([]);
  };

  const handleBatchMoveToSelectedFolder = () => {
    if (selectedNode.kind !== "folder") {
      setStatusMessage("Select a destination folder first.");
      return;
    }
    selectedNodeIds.forEach((nodeId, offset) => {
      if (nodeId !== selectedNode.id) {
        handleMoveNode(nodeId, selectedNode.id, selectedNode.children.length + offset);
      }
    });
    setSelectedNodeIds([]);
  };

  const exportWith = async (mode: "zip" | "folder") => {
    const overrideText =
      validationSummary.missing.length > 0 && overrideEnabled ? overrideExplanation.trim() : undefined;

    const { portfolioRoot, artifacts } = createExportArtifacts({
      root,
      metadata,
      files,
      validationMap,
      overrideExplanation: overrideText,
      summary: {
        missing: validationSummary.missing,
        partial: validationSummary.partial,
      },
    });

    try {
      if (mode === "zip") {
        await downloadZip(artifacts, portfolioRoot);
        setStatusMessage("ZIP export generated.");
        return;
      }

      await writeArtifactsToDirectory(artifacts, portfolioRoot);
      setStatusMessage("Portfolio files written to selected folder.");
    } catch {
      setStatusMessage("Export was cancelled or not supported.");
    }
  };

  return (
    <div className="min-h-screen bg-slatebrand-50 text-slate-900">
      <ReadinessModal
        open={readinessOpen}
        readiness={validationSummary.readiness}
        completed={validationSummary.completed}
        missing={validationSummary.missing}
        partial={validationSummary.partial}
        optionalMissing={validationSummary.optionalMissing}
        overrideEnabled={overrideEnabled}
        overrideExplanation={overrideExplanation}
        setOverrideEnabled={setOverrideEnabled}
        setOverrideExplanation={setOverrideExplanation}
        onClose={() => setReadinessOpen(false)}
        onExportZip={() => void exportWith("zip")}
        onExportFolder={() => void exportWith("folder")}
        folderExportSupported={Boolean(window.showDirectoryPicker)}
      />

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1800px] px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slatebrand-700">Course Portfolio Builder</p>
                <h1 className="mt-1 text-2xl font-semibold">Organize your course files by semester</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  Bring together teaching materials, assessments, and reports for each course you teach. Customize your folders and export a complete portfolio.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={workspaceMode === "builder" ? "btn-primary" : "btn-secondary"}
                  onClick={() => setWorkspaceMode("builder")}
                >
                  Portfolio structure builder
                </button>
                <button
                  type="button"
                  className={workspaceMode === "populate" ? "btn-primary" : "btn-secondary"}
                  onClick={() => setWorkspaceMode("populate")}
                >
                  Populate portfolio files
                </button>
                <button type="button" className="btn-secondary lg:hidden" onClick={() => setMobileLeftOpen((value) => !value)}>
                  {mobileLeftOpen ? "Hide map" : "Show map"}
                </button>
                <button type="button" className="btn-secondary lg:hidden" onClick={() => setMobileRightOpen((value) => !value)}>
                  {mobileRightOpen ? "Hide details" : "Show details"}
                </button>
                <button type="button" className="btn-primary" onClick={() => setReadinessOpen(true)}>
                  Review readiness
                </button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[2fr_1.6fr_1.6fr_1.6fr_2fr]">
              <Field label="Portfolio title" value={metadata.portfolioTitle} onChange={(value) => setMetadata((current) => ({ ...current, portfolioTitle: value }))} />
              <Field label="Semester" value={metadata.semester} onChange={(value) => setMetadata((current) => ({ ...current, semester: value }))} />
              <Field label="Course code" value={metadata.courseCode} onChange={(value) => setMetadata((current) => ({ ...current, courseCode: value }))} />
              <Field label="Section" value={metadata.section} onChange={(value) => setMetadata((current) => ({ ...current, section: value }))} />
              <Field label="Naming pattern" value={metadata.namingPattern} onChange={(value) => setMetadata((current) => ({ ...current, namingPattern: value }))} />
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 md:grid-cols-[1.6fr_auto_auto]">
                <div>
                  <label className="field-label">Template name</label>
                  <input className="input-base" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="My Course Template" />
                </div>
                <button type="button" className="btn-secondary" onClick={() => void handleSaveTemplate()}>
                  Save template
                </button>
                <div>
                  <label className="field-label">Load template</label>
                  <select className="input-base" defaultValue="" onChange={(event) => handleLoadTemplate(event.target.value)}>
                    <option value="" disabled>
                      Choose saved template
                    </option>
                    {savedTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-2xl bg-slatebrand-50 px-4 py-3 text-sm text-slatebrand-800">
                {statusMessage}
              </div>
            </div>
          </div>
        </div>
      </header>

      <input
        ref={importTemplateInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImportTemplateFile(file);
          }
          event.currentTarget.value = "";
        }}
      />

      <main className="mx-auto max-w-[1800px] px-4 py-6 lg:px-6">
        {workspaceMode === "builder" ? (
          <StructureBuilderWorkspace
            root={root}
            selectedNodeId={selectedNodeId}
            selectedIds={selectedNodeIds}
            validationMap={validationMap}
            savedTemplates={savedTemplates.map((template) => ({
              id: template.id,
              name: template.name,
            }))}
            onSelect={setSelectedNodeId}
            onToggleMultiSelect={handleToggleMultiSelect}
            onClearSelection={() => setSelectedNodeIds([])}
            onAddChild={(parentId, kind) => {
              const parent = findNode(root, parentId);
              if (!parent || parent.kind !== "folder") {
                return;
              }
              setRoot((current) =>
                insertChild(current, parentId, {
                  id: createId(),
                  name:
                    kind === "multiFile" ? "New Multifile" : kind === "file" ? "New File" : "New Folder",
                  kind,
                  required: true,
                  children: [],
                  allowMultipleFiles: kind === "multiFile" ? true : undefined,
                  maxFiles: kind === "file" ? 1 : undefined,
                  renameBehavior: kind === "folder" ? undefined : "standardize",
                }),
              );
              setSelectedNodeId(parentId);
            }}
            onRenameNode={(nodeId, name) =>
              setRoot((current) => updateNodeInTree(current, nodeId, (node) => ({ ...node, name })))
            }
            onDuplicateNode={(nodeId) =>
              setRoot((current) => {
                const target = findNode(current, nodeId);
                const parent = findParentNode(current, nodeId);
                if (!target || !parent) {
                  return current;
                }
                return insertChild(current, parent.id, duplicateNode(target));
              })
            }
            onDeleteNode={handleDeleteNode}
            onToggleRequired={(nodeId) =>
              setRoot((current) =>
                updateNodeInTree(current, nodeId, (node) => ({ ...node, required: !node.required })),
              )
            }
            onConvertNodeKind={handleConvertNodeKind}
            onMoveNode={handleMoveNode}
            onNewEmpty={handleNewEmptyStructure}
            onResetToDefault={handleResetToLatestDefault}
            onImportTemplate={() => importTemplateInputRef.current?.click()}
            onLoadSavedTemplate={handleLoadTemplate}
            onExportTemplate={handleExportTemplate}
            onSaveAsDefault={() => void handleSaveAsDefault()}
            onBatchConvert={handleBatchConvert}
            onBatchDelete={handleBatchDelete}
            onBatchSetRequired={handleBatchSetRequired}
            onBatchMoveToSelectedFolder={handleBatchMoveToSelectedFolder}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
            <div className={`${mobileLeftOpen ? "block" : "hidden"} lg:block`}>
              <LeftTreePanel
                root={root}
                selectedNodeId={selectedNodeId}
                validationMap={validationMap}
                onSelect={setSelectedNodeId}
                onMove={(parentId, sourceIndex, targetIndex) => {
                  const parent = findNode(root, parentId);
                  if (!parent || targetIndex < 0 || targetIndex >= parent.children.length) {
                    return;
                  }
                  setRoot((current) =>
                    moveNodeWithinParent(current, parentId, sourceIndex, targetIndex),
                  );
                }}
              />
            </div>

            <WorkspacePanel
              node={selectedNode}
              files={files.filter((file) => file.nodeId === selectedNode.id)}
              validation={validationMap[selectedNode.id]}
              onFilesAdded={handleFilesAdded}
              onRemoveFile={(fileId) =>
                setFiles((current) => current.filter((file) => file.id !== fileId))
              }
              onRoleChange={(fileId, role) =>
                setFiles((current) =>
                  current.map((file) => (file.id === fileId ? { ...file, role } : file)),
                )
              }
              availableRoles={getAvailableRoles(selectedNode)}
            />

            <div className={`${mobileRightOpen ? "block" : "hidden"} lg:block`}>
              <DetailsPanel
                node={selectedNode}
                files={files.filter((file) => file.nodeId === selectedNode.id)}
                metadata={metadata}
                validation={validationMap[selectedNode.id]}
                onRenameNode={(name) => updateSelectedNode((node) => ({ ...node, name }))}
                onSetRequired={(required) => updateSelectedNode((node) => ({ ...node, required }))}
                onAddChild={(kind) =>
                  setRoot((current) =>
                    insertChild(current, selectedNode.id, {
                      id: createId(),
                      name:
                        kind === "multiFile" ? "New Multifile" : kind === "file" ? "New File" : "New Folder",
                      kind,
                      required: true,
                      children: [],
                      allowMultipleFiles: kind === "multiFile" ? true : undefined,
                      maxFiles: kind === "file" ? 1 : undefined,
                      renameBehavior: kind === "folder" ? undefined : "standardize",
                    }),
                  )
                }
                onDuplicateNode={() =>
                  setRoot((current) => {
                    const parent = findParentNode(current, selectedNode.id);
                    if (!parent) {
                      return current;
                    }
                    return insertChild(current, parent.id, duplicateNode(selectedNode));
                  })
                }
                onDeleteNode={() => handleDeleteNode(selectedNode.id)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="input-base" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function collectNodeIds(node: PortfolioNode, ids = new Set<string>()) {
  ids.add(node.id);
  node.children.forEach((child) => collectNodeIds(child, ids));
  return ids;
}

export default App;
