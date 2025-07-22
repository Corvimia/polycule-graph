import { useState, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '../types';
import { useGraphUrlHash } from './useGraphUrlHash';

export function useGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
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
      style: { ...n.style, background: data.color ?? n.data.color },
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

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    // Clear selection if the deleted node was selected
    if (selected && selected.type === 'node' && selected.id === nodeId) {
      setSelected(null);
    }
  }, [selected]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    // Clear selection if the deleted edge was selected
    if (selected && selected.type === 'edge' && selected.id === edgeId) {
      setSelected(null);
    }
  }, [selected]);

  useGraphUrlHash(nodes, edges, setNodes, setEdges);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch (error) {
      console.error('Failed to copy link:', error);
      return false;
    }
  }, []);

  return {
    nodes, edges, selected,
    setSelected,
    addNode, addEdge,
    updateNode, updateEdge,
    deleteSelected, deleteNode, deleteEdge,
    setNodes, setEdges,
    copyLink,
  };
} 