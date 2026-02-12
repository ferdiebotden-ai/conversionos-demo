import type { Vec2, Wall } from '../state/drawing-types';

/**
 * Detect an enclosed room containing the given point by tracing connected walls.
 * Uses a simplified approach: finds the smallest polygon formed by connected wall
 * segments that encloses the given point.
 *
 * Returns the polygon vertices and area, or null if the point isn't enclosed.
 */
export function detectRoom(
  walls: Wall[],
  point: Vec2
): { vertices: Vec2[]; area: number } | null {
  if (walls.length < 3) return null;

  // Build adjacency graph from wall endpoints
  const SNAP = 0.15; // tolerance for connecting endpoints
  type Node = { x: number; z: number; edges: number[] };
  const nodes: Node[] = [];

  function findOrAddNode(pt: Vec2): number {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      if (Math.abs(node.x - pt.x) < SNAP && Math.abs(node.z - pt.z) < SNAP) {
        return i;
      }
    }
    nodes.push({ x: pt.x, z: pt.z, edges: [] });
    return nodes.length - 1;
  }

  // Build graph
  for (const wall of walls) {
    const a = findOrAddNode(wall.start);
    const b = findOrAddNode(wall.end);
    if (a !== b) {
      const nodeA = nodes[a]!;
      const nodeB = nodes[b]!;
      if (!nodeA.edges.includes(b)) nodeA.edges.push(b);
      if (!nodeB.edges.includes(a)) nodeB.edges.push(a);
    }
  }

  // Try to find the smallest cycle containing the point
  let bestPolygon: Vec2[] | null = null;
  let bestArea = Infinity;

  for (let startNode = 0; startNode < nodes.length; startNode++) {
    const startNodeData = nodes[startNode]!;
    for (const firstEdge of startNodeData.edges) {
      const polygon = traceCycle(nodes, startNode, firstEdge);
      if (!polygon || polygon.length < 3) continue;

      const area = shoelaceArea(polygon);
      if (area < 0.1) continue; // too small
      if (area >= bestArea) continue;

      if (pointInPolygon(point, polygon)) {
        bestPolygon = polygon;
        bestArea = area;
      }
    }
  }

  if (!bestPolygon) return null;

  return { vertices: bestPolygon, area: bestArea };
}

/** Trace a cycle by always turning right (clockwise) */
function traceCycle(nodes: { x: number; z: number; edges: number[] }[], start: number, first: number): Vec2[] | null {
  const path = [start, first];
  let prev = start;
  let curr = first;

  for (let i = 0; i < 20; i++) { // max 20 edges in a room
    const node = nodes[curr]!;
    if (node.edges.length < 2) return null;

    // Find next node by turning right (smallest clockwise angle)
    const prevNode = nodes[prev]!;
    const fromAngle = Math.atan2(prevNode.z - node.z, prevNode.x - node.x);
    let bestNext = -1;
    let bestAngle = Infinity;

    for (const next of node.edges) {
      if (next === prev) continue;
      const nextNode = nodes[next]!;
      const toAngle = Math.atan2(nextNode.z - node.z, nextNode.x - node.x);
      let angle = fromAngle - toAngle;
      if (angle <= 0) angle += 2 * Math.PI;
      if (angle < bestAngle) {
        bestAngle = angle;
        bestNext = next;
      }
    }

    if (bestNext === -1) return null;

    if (bestNext === start) {
      // Completed the cycle
      return path.map((idx) => {
        const n = nodes[idx]!;
        return { x: n.x, z: n.z };
      });
    }

    if (path.includes(bestNext)) return null; // stuck in a loop that doesn't close at start

    path.push(bestNext);
    prev = curr;
    curr = bestNext;
  }

  return null;
}

/** Calculate polygon area using the Shoelace formula */
export function shoelaceArea(vertices: Vec2[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const vi = vertices[i]!;
    const vj = vertices[j]!;
    area += vi.x * vj.z;
    area -= vj.x * vi.z;
  }
  return Math.abs(area) / 2;
}

/** Check if a point is inside a polygon using ray casting */
function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    if (
      (pi.z > point.z) !== (pj.z > point.z) &&
      point.x < ((pj.x - pi.x) * (point.z - pi.z)) / (pj.z - pi.z) + pi.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
