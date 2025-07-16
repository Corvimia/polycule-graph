import { useState, useEffect, useCallback } from 'react';
import dotparser from 'dotparser';
import type { GraphNode, GraphEdge, DotAst } from '../types';
import { toDot, dotAstToCytoscape } from '../utils/graphDot';

export function useDotDraft({ nodes, edges, setNodes, setEdges }: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
}) {
  const [dotDraft, setDotDraft] = useState(() => toDot(nodes, edges));
  const [dotDraftError, setDotDraftError] = useState<string | null>(null);
  const [dotValue, setDotValue] = useState(() => toDot(nodes, edges));
  const [dotError, setDotError] = useState<string | null>(null);

  useEffect(() => {
    const dot = toDot(nodes, edges);
    setDotValue(dot);
    setDotDraft(dot);
    setDotError(null);
    setDotDraftError(null);
  }, [nodes, edges]);

  const handleDotChange = useCallback((value: string | undefined) => {
    if (typeof value !== 'string') return;
    setDotDraft(value);
    try {
      if (!/^[\s\n\r]*(di)?graph\b/i.test(value)) throw new Error('DOT must start with "graph" or "digraph"');
      dotparser(value);
      setDotDraftError(null);
    } catch (err: unknown) {
      const error = err as Error;
      setDotDraftError(error.message || 'Invalid DOT');
    }
  }, []);

  const onSave = useCallback(() => {
    try {
      if (!/^[\s\n\r]*(di)?graph\b/i.test(dotDraft)) throw new Error('DOT must start with "graph" or "digraph"');
      const ast = dotparser(dotDraft) as DotAst;
      const { nodes: newNodes, edges: newEdges } = dotAstToCytoscape(ast);
      setDotError(null);
      setNodes(newNodes);
      setEdges(newEdges);
      setDotDraftError(null);
    } catch (err: unknown) {
      const error = err as Error;
      setDotDraftError(error.message || 'Invalid DOT');
    }
  }, [dotDraft, setNodes, setEdges]);

  return {
    dotDraft,
    dotDraftError,
    handleDotChange,
    onSave,
    dotValue,
    dotError,
  };
} 