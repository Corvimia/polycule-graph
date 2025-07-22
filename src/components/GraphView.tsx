import CytoscapeComponent from 'react-cytoscapejs';
import { useGraphContext } from '../contexts/GraphContext/GraphContext';
import { useTheme } from '../contexts/ThemeContext/ThemeContext';
import type cytoscape from 'cytoscape';
import { stringToColor } from '../utils/graphDot';
import { useState, useRef, useEffect } from 'react';
import { useCytoscapeInteractions } from '../hooks/useCytoscapeInteractions';

interface GraphViewProps {
  sidebarOpen: boolean;
  isMobile: boolean;
}

// Simple Card component for the menu container
const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg backdrop-blur-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Simple Button component for menu items
const Button = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export function GraphView({ sidebarOpen, isMobile }: GraphViewProps) {
  const { nodes, edges } = useGraphContext();
  const { dark } = useTheme();
  const [cy, setCy] = useState<cytoscape.Core | undefined>(undefined);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const {
    contextNode,
    contextMenuPos,
    edgeSource,
    setContextMenuPos,
    setEdgeSource,
  } = useCytoscapeInteractions(cy);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenuPos(null);
    if (contextMenuPos) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenuPos, setContextMenuPos]);

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
          cy={setCy}
        />
        {/* Custom Context Menu with nicer components */}
        {contextMenuPos && contextNode && (
          <div
            ref={contextMenuRef}
            style={{ 
              position: 'fixed', 
              left: contextMenuPos.x, 
              top: contextMenuPos.y, 
              zIndex: 1000 
            }}
            className="animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <Card className="min-w-[140px] p-1">
              <Button
                onClick={() => {
                  setEdgeSource(contextNode);
                  setContextMenuPos(null);
                }}
              >
                New edge
              </Button>
            </Card>
          </div>
        )}
      </div>
      {/* Optionally, show a hint when in edge creation mode */}
      {edgeSource && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg z-50">
          Click another node to create an edge from <b>{edgeSource}</b>
        </div>
      )}
    </main>
  );
} 