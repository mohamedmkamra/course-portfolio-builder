import { saveAs } from "file-saver";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { ExportArtifact, ManifestRow, PortfolioMetadata, PortfolioNode, UploadedFileRecord } from "../types";
import { buildExportFilename, buildPortfolioRootName } from "./naming";
import { walkTree } from "./tree";
import { ValidationItem } from "../types";

const buildMissingItemsReport = (
  summary: { missing: ValidationItem[]; partial: ValidationItem[] },
  explanation: string,
) => {
  const lines = [
    "Course Portfolio Builder - Missing Items Override Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Override explanation:",
    explanation,
    "",
    "Missing required items:",
    ...summary.missing.flatMap((item) => [
      `- ${item.nodeName}`,
      ...item.missingRequired.map((missing) => `  * ${missing}`),
    ]),
    "",
    "Partially completed items:",
    ...summary.partial.map((item) => `- ${item.nodeName}`),
  ];

  return lines.join("\n");
};

const buildManifestBlob = (rows: ManifestRow[]) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export const createExportArtifacts = ({
  root,
  metadata,
  files,
  validationMap,
  overrideExplanation,
  summary,
}: {
  root: PortfolioNode;
  metadata: PortfolioMetadata;
  files: UploadedFileRecord[];
  validationMap: Record<string, ValidationItem>;
  overrideExplanation?: string;
  summary: { missing: ValidationItem[]; partial: ValidationItem[] };
}) => {
  const portfolioRoot = buildPortfolioRootName(metadata);
  const rows: ManifestRow[] = [];
  const artifacts: ExportArtifact[] = [];

  walkTree(root, (node, path) => {
    const currentPath = [portfolioRoot, ...path.slice(1)].join("/");
    const nodeFiles = files.filter((file) => file.nodeId === node.id);
    const validationState = validationMap[node.id]?.status ?? "optional";

    if (nodeFiles.length === 0) {
      artifacts.push({
        path: currentPath,
        kind: "directory",
      });
    }

    for (const file of nodeFiles) {
      const exportFilename = buildExportFilename(metadata, node, file);
      const fullPath = `${currentPath}/${exportFilename}`;
      rows.push({
        originalFilename: file.originalName,
        exportFilename,
        classification: `${node.kind}:${file.role}`,
        destinationFolder: currentPath,
        validationState,
      });
      artifacts.push({ path: fullPath, kind: "file", file: file.file });
    }
  });

  artifacts.push({
    path: `${portfolioRoot}/portfolio_manifest.xlsx`,
    kind: "file",
    file: buildManifestBlob(rows),
  });

  if (overrideExplanation) {
    artifacts.push({
      path: `${portfolioRoot}/missing_items_report.txt`,
      kind: "file",
      file: new Blob([buildMissingItemsReport(summary, overrideExplanation)], {
        type: "text/plain;charset=utf-8",
      }),
    });
  }

  return { portfolioRoot, artifacts };
};

export const downloadZip = async (artifacts: ExportArtifact[], filename: string) => {
  const zip = new JSZip();

  artifacts.forEach((artifact) => {
    if (artifact.kind === "directory") {
      zip.folder(artifact.path);
      return;
    }
    if (artifact.file) {
      zip.file(artifact.path, artifact.file);
    }
  });

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${filename}.zip`);
};

type WritableDirectoryHandle = FileSystemDirectoryHandle;

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<WritableDirectoryHandle>;
  }
}

const ensureDirectory = async (
  rootHandle: WritableDirectoryHandle,
  segments: string[],
) => {
  let current = rootHandle;
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create: true });
  }
  return current;
};

export const writeArtifactsToDirectory = async (
  artifacts: ExportArtifact[],
  rootName: string,
) => {
  if (!window.showDirectoryPicker) {
    throw new Error("Directory export is not supported in this browser.");
  }

  const selectedDir = await window.showDirectoryPicker();

  for (const artifact of artifacts) {
    if (artifact.kind === "directory") {
      await ensureDirectory(selectedDir, artifact.path.split("/"));
      continue;
    }

    const parts = artifact.path.split("/");
    const fileName = parts.pop();
    if (!fileName || !artifact.file) {
      continue;
    }
    const targetDir = await ensureDirectory(selectedDir, parts);
    const handle = await targetDir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(artifact.file);
    await writable.close();
  }

  return `${rootName} exported`;
};
