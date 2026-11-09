import { PortfolioMetadata, PortfolioNode, UploadedFileRecord } from "../types";

const sanitizeSegment = (value: string) =>
  value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");

export const getFileExtension = (filename: string) => {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index + 1) : "";
};

export const buildExportFilename = (
  metadata: PortfolioMetadata,
  node: PortfolioNode,
  file: UploadedFileRecord,
) => {
  if (node.renameBehavior === "preserve") {
    return file.originalName;
  }

  const extension = getFileExtension(file.originalName);
  const itemType = sanitizeSegment(node.name);
  const fileRole = sanitizeSegment(file.role || "Document");

  const base = metadata.namingPattern
    .replace("{semester}", sanitizeSegment(metadata.semester))
    .replace("{courseCode}", sanitizeSegment(metadata.courseCode))
    .replace("{section}", sanitizeSegment(metadata.section))
    .replace("{itemType}", itemType)
    .replace("{fileRole}", fileRole);

  return extension ? `${base}.${extension}` : base;
};

export const buildPortfolioRootName = (metadata: PortfolioMetadata) =>
  [metadata.semester, metadata.courseCode, metadata.section]
    .map(sanitizeSegment)
    .filter(Boolean)
    .join("_") || "Course_Portfolio";
