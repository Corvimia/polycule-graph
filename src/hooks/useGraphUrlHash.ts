import { useEffect, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '../types';

export function useGraphUrlHash(nodes: GraphNode[], edges: GraphEdge[], setNodes: (nodes: GraphNode[]) => void, setEdges: (edges: GraphEdge[]) => void) {
  const encodeGraphState = useCallback((nodes: GraphNode[], edges: GraphEdge[]): string => {
    try {
      const json = JSON.stringify({ nodes, edges });
      return btoa(encodeURIComponent(json));
    } catch {
      return '';
    }
  }, []);

  const decodeGraphState = useCallback((str: string): { nodes: GraphNode[]; edges: GraphEdge[] } | null => {
    try {
      const json = decodeURIComponent(atob(str));
      const { nodes, edges } = JSON.parse(json);
      return { nodes, edges };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const encoded = encodeGraphState(nodes, edges);
    if (encoded && window.location.hash !== `#g=${encoded}`) {
      window.history.replaceState(null, '', `#g=${encoded}`);
    }
  }, [nodes, edges, encodeGraphState]);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith('#g=')) {
        const state = decodeGraphState(window.location.hash.slice(3));
        if (state && Array.isArray(state.nodes) && Array.isArray(state.edges)) {
          setNodes(state.nodes);
          setEdges(state.edges);
        }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [decodeGraphState, setNodes, setEdges]);

  return { encodeGraphState, decodeGraphState };
} 