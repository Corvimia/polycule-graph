import CytoscapeComponent from 'react-cytoscapejs';
import type { GraphNode, GraphEdge, CytoscapeEvent } from './types';

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selected: { type: 'node' | 'edge'; id: string } | null;
  setSelected: (sel: { type: 'node' | 'edge'; id: string } | null) => void;
  dark: boolean;
  sidebarOpen: boolean;
  isMobile: boolean;
}

// Debug: Log props to check rendering and data

// Hash a string to a color (HSL)
function stringToColor(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i) * (i + 13); // more entropy
  }
  // Add string length and char code sum for more randomness
  const charSum = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const h = Math.abs(hash + charSum * 31) % 360;
  const s = 65 + (charSum % 20); // 65-85%
  const l = 55 + (hash % 10); // 55-64%
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function GraphView({ nodes, edges, setSelected, dark, sidebarOpen, isMobile }: GraphViewProps) {
  // Debug: Log nodes and edges
  console.log('[GraphView] Rendering', { nodesCount: nodes.length, edgesCount: edges.length });
  console.log('[GraphView] nodes:', nodes);
  console.log('[GraphView] edges:', edges);
  return (
    <main className={`flex-1 flex flex-col items-stretch relative bg-neutral-100 dark:bg-neutral-900 min-w-0 min-h-0 overflow-hidden ${!isMobile && sidebarOpen ? 'ml-80' : ''} transition-all duration-200`} style={{ minHeight: '60vh', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center', minHeight: '60vh', height: '100%', minWidth: 0 }}>
        <CytoscapeComponent
          elements={[
            ...nodes.map(n => {
              // Use id as label if label is missing
              const label = n.data.label ?? n.id;
              return {
                ...n,
                data: {
                  id: n.id,
                  label,
                  color: n.data.color ?? stringToColor(label), // hash-based color
                  size: n.data.size ?? 48,
                }
              }
            }),
            ...edges.map(e => ({
              ...e,
              data: {
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.data.label ?? '',
                color: e.data.color ?? '#bdbdbd',
                width: e.data.width ?? 3,
                directed: e.directed !== false, // default to true if undefined
              }
            }))
          ]}
          style={{ width: '80vw', height: '100%', minHeight: 400, background: dark ? '#23272f' : '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', minWidth: 0 }}
          layout={{ name: 'cose', fit: true }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                'background-color': 'data(color)',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 22,
                'font-weight': 700,
                'width': 'data(size)',
                'height': 'data(size)',
                'border-width': 3,
                'border-color': '#fff4',
                'border-opacity': 1,
                'border-style': 'solid',
                'text-shadow': '0 2px 8px #000a',
                'box-shadow': '0 4px 24px #0002',
                'shape': 'ellipse', // changed from 'roundrectangle' to 'ellipse' for round nodes
                'background-opacity': 1,
              },
            },
            {
              selector: 'edge',
              style: {
                'width': 4,
                'line-color': '#bdbdbd',
                'target-arrow-color': '#bdbdbd',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': 16,
                'color': '#a5b4fc',
                'target-arrow-shape': 'none',
                'opacity': 0.95,
              },
            },
            {
              selector: 'edge[directed = 1]',
              style: {
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#bdbdbd',
              },
            },
          ]}
          cy={(cy: any) => { // fallback to any for cy instance for now
            if (typeof cy.off === 'function') cy.off('tap');
            cy.on('tap', 'node', (evt: CytoscapeEvent) => {
              const node = evt.target.data();
              setSelected({ type: 'node', id: node.id });
            });
            cy.on('tap', 'edge', (evt: CytoscapeEvent) => {
              const edge = evt.target.data();
              setSelected({ type: 'edge', id: edge.id });
            });
            cy.on('tap', (evt: CytoscapeEvent) => {
              // If the tap target is the background, clear selection
              if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
                setSelected(null);
              }
            });
          }}
        />
      </div>
    </main>
  );
} 