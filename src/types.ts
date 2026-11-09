export type NodeKind = "folder" | "file" | "multiFile";

export type ValidationStatus = "complete" | "missing" | "partial" | "optional";

export interface PortfolioNode {
  id: string;
  name: string;
  kind: NodeKind;
  required: boolean;
  children: PortfolioNode[];
  notes?: string;
  allowMultipleFiles?: boolean;
  maxFiles?: number;
  renameBehavior?: "standardize" | "preserve";
}

export interface UploadedFileRecord {
  id: string;
  nodeId: string;
  file: File;
  role: string;
  originalName: string;
  previewUrl?: string;
  uploadedAt: string;
}

export interface PortfolioMetadata {
  portfolioTitle: string;
  semester: string;
  courseCode: string;
  section: string;
  namingPattern: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  root: PortfolioNode;
  metadataDefaults?: Partial<PortfolioMetadata>;
  createdAt: string;
}

export interface ValidationItem {
  nodeId: string;
  nodeName: string;
  status: ValidationStatus;
  completionRatio: number;
  missingRequired: string[];
  optionalMissing: string[];
  guidance: string[];
}

export interface ManifestRow {
  originalFilename: string;
  exportFilename: string;
  classification: string;
  destinationFolder: string;
  validationState: ValidationStatus;
}

export interface ExportArtifact {
  path: string;
  kind: "file" | "directory";
  file?: Blob;
}

export interface PortfolioSnapshot {
  root: PortfolioNode;
  metadata: PortfolioMetadata;
  files: UploadedFileRecord[];
  selectedNodeId: string;
  savedAt: string;
}
