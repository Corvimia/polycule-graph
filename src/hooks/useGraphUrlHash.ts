import { useEffect, useCallback, useState } from 'react';
import pako from 'pako';
import type { GraphNode, GraphEdge } from '../types';
import { defaultNodes, defaultEdges } from '../utils/graphDefaults';

export function useGraphUrlHash(nodes: GraphNode[], edges: GraphEdge[], setNodes: (nodes: GraphNode[]) => void, setEdges: (edges: GraphEdge[]) => void) {
  const [isLoaded, setIsLoaded] = useState(false);

  const encodeGraphState = useCallback((nodes: GraphNode[], edges: GraphEdge[]): string => {
    try {
      const json = JSON.stringify({ nodes, edges });
      const compressed = pako.gzip(json);
      return btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    } catch {
      return '';
    }
  }, []);

  const decodeGraphState = useCallback((str: string): { nodes: GraphNode[]; edges: GraphEdge[] } | null => {
    try {
      console.log('[useGraphUrlHash] Attempting to decode:', str);
      const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const json = pako.inflate(compressed, { to: 'string' });
      const { nodes, edges } = JSON.parse(json);
      console.log('[useGraphUrlHash] Successfully decoded:', { nodes: nodes.length, edges: edges.length });
      return { nodes, edges };
    } catch (error) {
      console.error('[useGraphUrlHash] Decode error:', error);
      return null;
    }
  }, []);

  // Encode graph state to URL hash (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    
    const encoded = encodeGraphState(nodes, edges);
    if (encoded && window.location.hash !== `#g=${encoded}`) {
      window.history.replaceState(null, '', `#g=${encoded}`);
    }
  }, [nodes, edges, encodeGraphState, isLoaded]);

  useEffect(() => {
    const loadGraphFromHash = () => {
      console.log('[useGraphUrlHash] loadGraphFromHash called, hash:', window.location.hash);
      if (window.location.hash.startsWith('#g=')) {
        console.log('[useGraphUrlHash] Found graph hash, attempting to decode...');
        const state = decodeGraphState(window.location.hash.slice(3));
        if (state && Array.isArray(state.nodes) && Array.isArray(state.edges)) {
          console.log('[useGraphUrlHash] Setting nodes and edges:', { nodes: state.nodes.length, edges: state.edges.length });
          setNodes(state.nodes);
          setEdges(state.edges);
        } else {
          console.log('[useGraphUrlHash] Failed to decode or invalid state, loading defaults');
          setNodes(defaultNodes);
          setEdges(defaultEdges);
        }
      } else {
        console.log('[useGraphUrlHash] No graph hash found, loading defaults');
        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
      // Mark as loaded after setting the initial state
      setIsLoaded(true);
    };

    // Load graph state on initial mount (for page refresh)
    console.log('[useGraphUrlHash] Initial mount, calling loadGraphFromHash');
    loadGraphFromHash();

    // Listen for hash changes
    const onHashChange = () => {
      console.log('[useGraphUrlHash] Hash changed, calling loadGraphFromHash');
      loadGraphFromHash();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [decodeGraphState, setNodes, setEdges]);

  return { encodeGraphState, decodeGraphState };
} 