import { useEffect, useCallback, useState } from 'react';
import pako from 'pako';
import type { GraphNode, GraphEdge, DotAst } from '../types';
import { defaultNodes, defaultEdges } from '../utils/graphDefaults';
import { toDot, dotAstToCytoscape } from '../utils/graphDot';
import dotparser from 'dotparser';

export function useGraphUrlHash(nodes: GraphNode[], edges: GraphEdge[], setNodes: (nodes: GraphNode[]) => void, setEdges: (edges: GraphEdge[]) => void) {
  const [isLoaded, setIsLoaded] = useState(false);

  const encodeGraphState = useCallback((nodes: GraphNode[], edges: GraphEdge[]): string => {
    try {
      // Convert to DOT format instead of encoding full arrays
      const dotContent = toDot(nodes, edges);
      const compressed = pako.gzip(dotContent);
      return btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    } catch {
      return '';
    }
  }, []);

  const decodeGraphState = useCallback((str: string): { nodes: GraphNode[]; edges: GraphEdge[] } | null => {
    try {
      const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0));
      const dotContent = pako.inflate(compressed, { to: 'string' });
      
      // Parse DOT content back to graph data
      const ast = dotparser(dotContent) as DotAst;
      const { nodes, edges } = dotAstToCytoscape(ast);
      return { nodes, edges };
    } catch (error) {
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
      if (window.location.hash.startsWith('#g=')) {
        const state = decodeGraphState(window.location.hash.slice(3));
        if (state && Array.isArray(state.nodes) && Array.isArray(state.edges)) {
          setNodes(state.nodes);
          setEdges(state.edges);
        } else {
          setNodes(defaultNodes);
          setEdges(defaultEdges);
        }
      } else {
        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
      // Mark as loaded after setting the initial state
      setIsLoaded(true);
    };

    // Load graph state on initial mount (for page refresh)
    loadGraphFromHash();

    // Listen for hash changes
    const onHashChange = () => {
      loadGraphFromHash();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [decodeGraphState, setNodes, setEdges]);

  return { encodeGraphState, decodeGraphState };
} 