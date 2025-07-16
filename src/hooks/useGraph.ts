import { useState, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '../types';
import { useGraphUrlHash } from './useGraphUrlHash';
import { defaultNodes, defaultEdges } from '../utils/graphDefaults';

export function useGraph() {
  const initialGraph = (() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#g=')) {
      try {
        const json = decodeURIComponent(atob(window.location.hash.slice(3)));
        const { nodes, edges } = JSON.parse(json);
        if (Array.isArray(nodes) && Array.isArray(edges)) {
          return { nodes, edges };
        }
      } catch {
        // ignore
      }
    }
    return { nodes: defaultNodes, edges: defaultEdges };
  })();

  const [nodes, setNodes] = useState<GraphNode[]>(initialGraph.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialGraph.edges);
  const [selected, setSelected] = useState<{ type: 'node' | 'edge'; id: string } | null>(null);

  const addNode = useCallback((options?: { id?: string; label?: string; position?: { x: number; y: number } }) => {
    let id = options?.id;
    if (!id) {
      id = `Node${nodes.length + 1}`;
    }
    setNodes(nds => [
      ...nds,
      {
        id,
        data: { label: options?.label ?? id },
        type: 'default',
        position: options?.position,
      } as GraphNode,
    ]);
  }, [nodes.length]);

  const addEdge = useCallback((source: string, target: string) => {
    setEdges(eds => [
      ...eds,
      {
        id: `e${eds.length + 1}`,
        source,
        target,
        type: 'smoothstep',
        data: {},
      } as GraphEdge,
    ]);
  }, []);

  const updateNode = useCallback((id: string, data: Partial<GraphNode['data']>) => {
    setNodes(nds => nds.map(n => n.id === id ? {
      ...n,
      data: { ...n.data, ...data },
      style: { ...n.style, background: data.color ?? n.data.color, width: data.size ?? n.data.size, height: data.size ?? n.data.size },
    } : n));
  }, []);
  const updateEdge = useCallback((id: string, data: Partial<GraphEdge['data']>) => {
    setEdges(eds => eds.map(e => e.id === id ? {
      ...e,
      data: { ...e.data, ...data },
      style: { ...e.style, stroke: data.color ?? e.data.color, strokeWidth: data.width ?? e.data.width },
    } : e));
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (selected.type === 'node') {
      setNodes(nds => nds.filter(n => n.id !== selected.id));
      setEdges(eds => eds.filter(e => e.source !== selected.id && e.target !== selected.id));
    } else {
      setEdges(eds => eds.filter(e => e.id !== selected.id));
    }
    setSelected(null);
  }, [selected]);

  useGraphUrlHash(nodes, edges, setNodes, setEdges);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return {
    nodes, edges, selected,
    setSelected,
    addNode, addEdge,
    updateNode, updateEdge,
    deleteSelected,
    setNodes, setEdges,
    copyLink,
  };
} 