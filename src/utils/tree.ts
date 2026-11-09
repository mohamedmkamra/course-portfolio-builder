import { PortfolioNode } from "../types";
import { createId } from "./id";

export const cloneNode = (node: PortfolioNode): PortfolioNode => ({
  ...node,
  children: node.children.map(cloneNode),
});

export const duplicateNode = (node: PortfolioNode): PortfolioNode => ({
  ...cloneNode(node),
  id: createId(),
  name: `${node.name} Copy`,
  children: node.children.map((child) => deepRefreshIds(child)),
});

const deepRefreshIds = (node: PortfolioNode): PortfolioNode => ({
  ...node,
  id: createId(),
  children: node.children.map(deepRefreshIds),
});

export const findNode = (node: PortfolioNode, id: string): PortfolioNode | null => {
  if (node.id === id) {
    return node;
  }

  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) {
      return found;
    }
  }

  return null;
};

export const updateNodeInTree = (
  node: PortfolioNode,
  id: string,
  updater: (target: PortfolioNode) => PortfolioNode,
): PortfolioNode => {
  if (node.id === id) {
    return updater(node);
  }

  return {
    ...node,
    children: node.children.map((child) => updateNodeInTree(child, id, updater)),
  };
};

export const removeNodeFromTree = (node: PortfolioNode, id: string): PortfolioNode => ({
  ...node,
  children: node.children
    .filter((child) => child.id !== id)
    .map((child) => removeNodeFromTree(child, id)),
});

export const insertChild = (
  node: PortfolioNode,
  parentId: string,
  newChild: PortfolioNode,
): PortfolioNode => {
  if (node.id === parentId) {
    return { ...node, children: [...node.children, newChild] };
  }

  return {
    ...node,
    children: node.children.map((child) => insertChild(child, parentId, newChild)),
  };
};

export const insertChildAtIndex = (
  node: PortfolioNode,
  parentId: string,
  newChild: PortfolioNode,
  targetIndex: number,
): PortfolioNode => {
  if (node.id === parentId) {
    const nextChildren = [...node.children];
    const boundedIndex = Math.max(0, Math.min(targetIndex, nextChildren.length));
    nextChildren.splice(boundedIndex, 0, newChild);
    return { ...node, children: nextChildren };
  }

  return {
    ...node,
    children: node.children.map((child) =>
      insertChildAtIndex(child, parentId, newChild, targetIndex),
    ),
  };
};

export const moveNodeWithinParent = (
  node: PortfolioNode,
  parentId: string,
  sourceIndex: number,
  targetIndex: number,
): PortfolioNode => {
  if (node.id === parentId) {
    const nextChildren = [...node.children];
    const [moved] = nextChildren.splice(sourceIndex, 1);
    nextChildren.splice(targetIndex, 0, moved);
    return { ...node, children: nextChildren };
  }

  return {
    ...node,
    children: node.children.map((child) =>
      moveNodeWithinParent(child, parentId, sourceIndex, targetIndex),
    ),
  };
};

export const walkTree = (
  node: PortfolioNode,
  visitor: (node: PortfolioNode, path: string[]) => void,
  path: string[] = [],
) => {
  const nextPath = [...path, node.name];
  visitor(node, nextPath);
  node.children.forEach((child) => walkTree(child, visitor, nextPath));
};

export const flattenTree = (node: PortfolioNode): PortfolioNode[] => {
  const items: PortfolioNode[] = [];
  walkTree(node, (current) => items.push(current));
  return items;
};

export const findParentNode = (node: PortfolioNode, targetId: string): PortfolioNode | null => {
  for (const child of node.children) {
    if (child.id === targetId) {
      return node;
    }
    const nested = findParentNode(child, targetId);
    if (nested) {
      return nested;
    }
  }

  return null;
};

export const isDescendantNode = (node: PortfolioNode, possibleDescendantId: string): boolean => {
  if (node.id === possibleDescendantId) {
    return true;
  }

  return node.children.some((child) => isDescendantNode(child, possibleDescendantId));
};

export const extractNodeFromTree = (
  node: PortfolioNode,
  targetId: string,
): { tree: PortfolioNode; extracted: PortfolioNode | null } => {
  let extracted: PortfolioNode | null = null;

  const nextChildren = node.children
    .filter((child) => {
      if (child.id === targetId) {
        extracted = child;
        return false;
      }
      return true;
    })
    .map((child) => {
      const result = extractNodeFromTree(child, targetId);
      if (result.extracted) {
        extracted = result.extracted;
      }
      return result.tree;
    });

  return {
    tree: {
      ...node,
      children: nextChildren,
    },
    extracted,
  };
};
