import { PortfolioNode, UploadedFileRecord, ValidationItem, ValidationStatus } from "../types";

const getFilesForNode = (files: UploadedFileRecord[], nodeId: string) =>
  files.filter((file) => file.nodeId === nodeId);

export const getDefaultRoleForNode = (node: PortfolioNode) =>
  node.kind === "file" || node.kind === "multiFile" ? node.name : "Document";

export const getAvailableRoles = (node: PortfolioNode) =>
  node.kind === "file" || node.kind === "multiFile" ? [node.name] : ["Document", "Evidence", "Supporting"];

export const validateNode = (
  node: PortfolioNode,
  files: UploadedFileRecord[],
  childResults: ValidationItem[] = [],
): ValidationItem => {
  const nodeFiles = getFilesForNode(files, node.id);
  const missingRequired: string[] = [];
  const optionalMissing: string[] = [];
  const guidance: string[] = [];

  if (node.kind === "file" || node.kind === "multiFile") {
    const maxFiles = node.maxFiles;

    if (node.required && nodeFiles.length === 0) {
      missingRequired.push(node.name);
      guidance.push("Upload the expected file for this item.");
    }

    if (typeof maxFiles === "number" && nodeFiles.length > maxFiles) {
      guidance.push(`Only ${maxFiles} file${maxFiles === 1 ? "" : "s"} should be uploaded here.`);
    }

    if (!node.required && nodeFiles.length === 0) {
      optionalMissing.push("No file uploaded yet");
    }
  } else {
    const requiredChildren = childResults.filter((child) => child.status !== "optional");
    const completeChildren = childResults.filter((child) => child.status === "complete");

    if (requiredChildren.length > 0 && completeChildren.length !== requiredChildren.length) {
      missingRequired.push(...requiredChildren.flatMap((child) => child.missingRequired));
    }

    if (!node.required && nodeFiles.length === 0 && childResults.length === 0) {
      optionalMissing.push("No file uploaded yet");
    }
  }

  const childCompletion = childResults.length
    ? childResults.reduce((sum, child) => sum + child.completionRatio, 0) / childResults.length
    : 0;
  const fileCompletion = nodeFiles.length > 0 ? 1 : 0;

  let completionRatio = Math.max(childCompletion, fileCompletion);

  let status: ValidationStatus = "optional";

  if (!node.required && nodeFiles.length === 0 && childResults.every((child) => child.status === "optional")) {
    status = "optional";
  } else if (missingRequired.length === 0 && (nodeFiles.length > 0 || childResults.some((child) => child.status === "complete"))) {
    status = "complete";
    completionRatio = 1;
  } else if (
    nodeFiles.length > 0 ||
    childResults.some((child) => child.status === "complete" || child.status === "partial")
  ) {
    status = "partial";
  } else if (node.required) {
    status = "missing";
  }

  if ((node.kind === "file" || node.kind === "multiFile") && typeof node.maxFiles === "number" && nodeFiles.length > node.maxFiles) {
    status = "partial";
  }

  return {
    nodeId: node.id,
    nodeName: node.name,
    status,
    completionRatio,
    missingRequired: Array.from(new Set(missingRequired)),
    optionalMissing: Array.from(new Set(optionalMissing)),
    guidance,
  };
};

export const validateTree = (
  node: PortfolioNode,
  files: UploadedFileRecord[],
  resultMap: Record<string, ValidationItem> = {},
): Record<string, ValidationItem> => {
  const childItems = node.children.map((child) => {
    validateTree(child, files, resultMap);
    return resultMap[child.id];
  });

  resultMap[node.id] = validateNode(node, files, childItems);
  return resultMap;
};

export const summarizeValidation = (items: ValidationItem[]) => {
  const requiredItems = items.filter((item) => item.status !== "optional");
  const completed = requiredItems.filter((item) => item.status === "complete");
  const missing = requiredItems.filter((item) => item.status === "missing");
  const partial = requiredItems.filter((item) => item.status === "partial");
  const optionalMissing = items.filter(
    (item) => item.status === "optional" && item.optionalMissing.length > 0,
  );

  return {
    readiness: requiredItems.length
      ? Math.round((completed.length / requiredItems.length) * 100)
      : 100,
    completed,
    missing,
    partial,
    optionalMissing,
  };
};
