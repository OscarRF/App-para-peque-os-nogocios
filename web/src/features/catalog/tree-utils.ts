import type { CategoryNodeResponse } from "@/api/generated/model";

export interface ParentOption {
  id: string;
  name: string;
  pathLabel: string;
  level: number;
}

export interface TreeStats {
  total: number;
  roots: number;
  subcategories: number;
  maxDepth: number;
}

export function getTreeStats(nodes: CategoryNodeResponse[]): TreeStats {
  let total = 0;
  let maxDepth = 0;

  function walk(branch: CategoryNodeResponse[], depth: number) {
    for (const node of branch) {
      total += 1;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      walk(node.children ?? [], depth + 1);
    }
  }

  walk(nodes, 1);
  const roots = nodes.length;
  return {
    total,
    roots,
    subcategories: Math.max(0, total - roots),
    maxDepth,
  };
}

export function findNodeById(
  nodes: CategoryNodeResponse[],
  targetId: string,
): CategoryNodeResponse | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }
    const found = findNodeById(node.children ?? [], targetId);
    if (found) {
      return found;
    }
  }
  return null;
}

export function getBreadcrumb(
  nodes: CategoryNodeResponse[],
  targetId: string,
  trail: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node.name];
    if (node.id === targetId) {
      return nextTrail;
    }
    const found = getBreadcrumb(node.children ?? [], targetId, nextTrail);
    if (found) {
      return found;
    }
  }
  return null;
}

export function getDescendantIds(node: CategoryNodeResponse): Set<string> {
  const ids = new Set<string>([node.id]);
  for (const child of node.children ?? []) {
    for (const descendantId of getDescendantIds(child)) {
      ids.add(descendantId);
    }
  }
  return ids;
}

export function flattenParentOptions(
  nodes: CategoryNodeResponse[],
  excludedIds: Set<string>,
  trail: string[] = [],
): ParentOption[] {
  const options: ParentOption[] = [];
  for (const node of nodes) {
    if (excludedIds.has(node.id)) {
      continue;
    }
    const nextTrail = [...trail, node.name];
    options.push({
      id: node.id,
      name: node.name,
      pathLabel: nextTrail.join(" > "),
      level: node.level,
    });
    options.push(...flattenParentOptions(node.children ?? [], excludedIds, nextTrail));
  }
  return options;
}

export function filterTree(
  nodes: CategoryNodeResponse[],
  rawQuery: string,
): CategoryNodeResponse[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return nodes;
  }

  const result: CategoryNodeResponse[] = [];
  for (const node of nodes) {
    const filteredChildren = filterTree(node.children ?? [], query);
    const matchesSelf = node.name.toLowerCase().includes(query);
    if (matchesSelf || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: matchesSelf && filteredChildren.length === 0 ? node.children : filteredChildren,
      });
    }
  }
  return result;
}
