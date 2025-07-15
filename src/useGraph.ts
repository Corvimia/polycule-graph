import { useState, useEffect, useCallback } from 'react';
import dotparser from 'dotparser';
import type { GraphNode, GraphEdge, DotAst, DotAttr } from './types';

// Utility functions (copied from App.tsx or extracted)
function encodeGraphState(nodes: GraphNode[], edges: GraphEdge[]): string {
  try {
    const json = JSON.stringify({ nodes, edges });
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}
function decodeGraphState(str: string): { nodes: GraphNode[]; edges: GraphEdge[] } | null {
  try {
    const json = decodeURIComponent(atob(str));
    const { nodes, edges } = JSON.parse(json);
    return { nodes, edges };
  } catch {
    return null;
  }
}
function toDot(nodes: GraphNode[], edges: GraphEdge[]): string {
  // Always use undirected graph and edges
  const graphType = 'graph';
  let dot = `${graphType} G {\n`;
  for (const node of nodes) {
    const label = node.data?.label;
    const color = node.data?.color ? `color=\"${node.data.color}\"` : '';
    const size = node.data?.size ? `width=${(node.data.size/40).toFixed(2)}, height=${(node.data.size/40).toFixed(2)}, fixedsize=true` : '';
    const labelAttr = label && label !== node.id ? `label=\"${label}\"` : '';
    const attrs = [labelAttr, color, size].filter(Boolean).join(', ');
    dot += `  \"${node.id}\"${attrs ? ` [${attrs}]` : ''};\n`;
  }
  for (const edge of edges) {
    const label = edge.data?.label ? `label=\"${edge.data.label}\"` : '';
    const color = edge.data?.color ? `color=\"${edge.data.color}\"` : '';
    const width = edge.data?.width ? `penwidth=${edge.data.width}` : '';
    const attrs = [label, color, width].filter(Boolean).join(', ');
    dot += `  \"${edge.source}\" -- \"${edge.target}\"${attrs ? ` [${attrs}]` : ''};\n`;
  }
  dot += '}';
  return dot;
}
function dotAstToCytoscape(ast: DotAst): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeSet = new Set<string>();

  console.log('ast', ast);

  function getAttrs(attrsArr: DotAttr[]): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (!Array.isArray(attrsArr)) return attrs;
    for (const attr of attrsArr) {
      if (attr.type === 'attr') {
        attrs[attr.id] = attr.eq;
      }
    }
    return attrs;
  }

  function walk(children: any[]): void { // children is DotAstNode[] but keep as any[] for now
    for (const child of children) {
      if (child.type === 'node_stmt') {
        const id = child.node_id.id;
        nodeSet.add(id);
        const attrs = getAttrs(child.attr_list);
        const label = attrs.label && attrs.label !== id ? attrs.label : undefined;
        nodes.push({
          id,
          data: {
            ...(label ? { label } : {}),
            ...(attrs.color ? { color: attrs.color } : {}),
            ...(attrs.width ? { size: Number(attrs.width) * 40 } : {}),
          },
          type: 'default',
          style: {
            ...(attrs.color ? { background: attrs.color } : {}),
            ...(attrs.width ? { width: Number(attrs.width) * 40, height: Number(attrs.width) * 40 } : {}),
          },
        });
      } else if (child.type === 'edge_stmt') {
        const edgeList = child.edge_list;
        const attrs = getAttrs(child.attr_list);
        // Detect if edge is directed or undirected
        const directed = child.edgeop === '->' || child.edgeop === undefined; // dotparser may omit edgeop for digraph
        for (let i = 0; i < edgeList.length - 1; ++i) {
          const source = edgeList[i].id;
          const target = edgeList[i + 1].id;
          nodeSet.add(source);
          nodeSet.add(target);
          edges.push({
            id: `${source}${directed ? '->' : '--'}${target}`,
            source,
            target,
            type: 'smoothstep',
            data: {
              ...(attrs.label ? { label: attrs.label } : {}),
              ...(attrs.color ? { color: attrs.color } : {}),
              ...(attrs.penwidth ? { width: Number(attrs.penwidth) } : {}),
            },
            style: {
              ...(attrs.color ? { stroke: attrs.color } : {}),
              ...(attrs.penwidth ? { strokeWidth: Number(attrs.penwidth) } : {}),
            },
            directed,
          });
        }
      } else if (child.type === 'subgraph') {
        walk(child.children);
      }
    }
  }

  for (const graph of ast) {
    if (graph.children) walk(graph.children);
  }
  nodeSet.forEach(id => {
    if (!nodes.find(n => n.id === id)) {
      nodes.push({
        id,
        data: {},
        type: 'default',
      });
    }
  });
  return { nodes, edges };
}

// New hook for DOT draft editing
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

  // Sync dotValue and dotDraft to nodes/edges
  useEffect(() => {
    const dot = toDot(nodes, edges);
    setDotValue(dot);
    setDotDraft(dot);
    setDotError(null);
    setDotDraftError(null);
  }, [nodes, edges]);

  // handleDotChange only updates the draft
  const handleDotChange = useCallback((value: string | undefined) => {
    if (typeof value !== 'string') return;
    setDotDraft(value);
    // Validate draft, but do not update graph
    try {
      if (!/^[\s\n\r]*(di)?graph\b/i.test(value)) throw new Error('DOT must start with "graph" or "digraph"');
      dotparser(value);
      setDotDraftError(null);
    } catch (err: any) {
      setDotDraftError(err.message || 'Invalid DOT');
    }
  }, []);

  // Save/apply draft to graph
  const onSave = useCallback(() => {
    try {
      if (!/^[\s\n\r]*(di)?graph\b/i.test(dotDraft)) throw new Error('DOT must start with "graph" or "digraph"');
      const ast = dotparser(dotDraft) as DotAst; // Ensure correct type
      const { nodes: newNodes, edges: newEdges } = dotAstToCytoscape(ast);
      setDotError(null);
      setNodes(newNodes);
      setEdges(newEdges);
      setDotDraftError(null);
    } catch (err: any) {
      setDotDraftError(err.message || 'Invalid DOT');
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

export function useGraph() {
  // Default test graph
  const defaultNodes = [
    {
      id: 'A',
      data: {},
      type: 'default',
    },
    {
      id: 'B',
      data: {},
      type: 'default',
    },
    {
      id: 'C',
      data: {},
      type: 'default',
    },
  ];
  const defaultEdges = [
    {
      id: 'A->B',
      source: 'A',
      target: 'B',
      type: 'smoothstep',
      data: { label: '' },
      directed: true,
    },
    {
      id: 'B--C',
      source: 'B',
      target: 'C',
      type: 'smoothstep',
      data: { label: '' },
      directed: false,
    },
  ];

  // Try to load from URL hash, otherwise use default
  const initialGraph = (() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#g=')) {
      const state = decodeGraphState(window.location.hash.slice(3));
      if (state && Array.isArray(state.nodes) && Array.isArray(state.edges)) {
        return { nodes: state.nodes, edges: state.edges };
      }
    }
    return { nodes: defaultNodes, edges: defaultEdges };
  })();

  const [nodes, setNodes] = useState<GraphNode[]>(initialGraph.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialGraph.edges);
  const [selected, setSelected] = useState<{ type: 'node' | 'edge'; id: string } | null>(null);

  useEffect(() => {
    console.log('nodes', nodes);
    console.log('edges', edges);
  }, [nodes, edges]);

  // Add node
  const addNode = useCallback(() => {
    const id = `Node${nodes.length + 1}`;
    setNodes(nds => [
      ...nds,
      {
        id,
        data: { label: id },
        type: 'default',
      } as GraphNode,
    ]);
  }, [nodes.length]);

  // Add edge
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

  // Update node/edge
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

  // Delete node/edge
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

  // URL hash sync
  useEffect(() => {
    const encoded = encodeGraphState(nodes, edges);
    if (encoded && window.location.hash !== `#g=${encoded}`) {
      window.history.replaceState(null, '', `#g=${encoded}`);
    }
  }, [nodes, edges]);
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
  }, []);

  // Copy link
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return {
    nodes, edges, selected,
    setSelected,
    addNode, addEdge,
    updateNode, updateEdge,
    deleteSelected,
    setNodes, setEdges, // for advanced use
    copyLink,
  };
} 