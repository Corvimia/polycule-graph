import CytoscapeComponent from 'react-cytoscapejs';
import { Plus, Trash2 } from 'lucide-react';
import { useGraphContext } from '../contexts/GraphContext/GraphContext';
import { useTheme } from '../contexts/ThemeContext/ThemeContext';
import type cytoscape from 'cytoscape';
import { stringToColor } from '../utils/graphDot';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useCytoscapeInteractions } from '../hooks/useCytoscapeInteractions';
import { ContextMenu, ContextMenuItem, ContextMenuRoot } from './ui/context-menu';

interface GraphViewProps {
  sidebarOpen: boolean;
  isMobile: boolean;
}

export function GraphView({ sidebarOpen, isMobile }: GraphViewProps) {
  const { nodes, edges, deleteNode, deleteEdge, addNode } = useGraphContext();
  const { dark } = useTheme();
  const [cy, setCy] = useState<cytoscape.Core | undefined>(undefined);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

  // Function to manually trigger layout
  const triggerLayout = useCallback(() => {
    if (cy) {
      setIsLayoutRunning(true);
      const layout = cy.layout({
        name: 'cose',
        fit: true,
      });
      
      layout.on('layoutstop', () => {
        setIsLayoutRunning(false);
      });
      
      layout.run();
    }
  }, [cy]);

  const {
    contextNode,
    contextEdge,
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



  // Run layout on initial load
  useEffect(() => {
    if (cy && nodes.length > 0) {
      // Small delay to ensure the graph is fully rendered
      const timer = setTimeout(() => {
        triggerLayout();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cy, nodes.length, triggerLayout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Press 'L' to trigger layout
      if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        triggerLayout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerLayout]);

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
          layout={{ 
            name: 'cose', 
            fit: true,
            padding: 100,
            nodeDimensionsIncludeLabels: true,
            nodeRepulsion: 15000,
            nodeOverlap: 20,
            idealEdgeLength: 300,
            edgeElasticity: 0.3,
            nestingFactor: 0.1,
            gravity: 40,
            numIter: 2500,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0,
            randomize: true,
            animate: true
          }}
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
        {/* Edge creation mode indicator */}
        {edgeSource && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Click on a target node to create an edge</span>
          </div>
        )}
        
        {/* Layout status indicator */}
        {isLayoutRunning && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
            <span className="font-medium">Layout running...</span>
          </div>
        )}
        
        {/* Layout help indicator */}
        {!isLayoutRunning && nodes.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-lg shadow-lg z-10 text-sm opacity-75">
            Press 'L' to re-layout
          </div>
        )}
        {/* Custom Context Menu for nodes and edges */}
        <ContextMenuRoot position={contextMenuPos} menuRef={contextMenuRef}>
          {(contextNode || contextEdge) && (
            <ContextMenu>
              {/* Node context menu */}
              {contextNode && (
                <>
                  <ContextMenuItem
                    icon={Plus}
                    onClick={() => {
                      setEdgeSource(contextNode);
                      setContextMenuPos(null);
                    }}
                  >
                    New edge
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={Trash2}
                    className="text-red-400 hover:bg-red-900/20"
                    onClick={() => {
                      deleteNode(contextNode);
                      setContextMenuPos(null);
                    }}
                  >
                    Delete
                  </ContextMenuItem>
                </>
              )}
              {/* Edge context menu */}
              {contextEdge && (
                <ContextMenuItem
                  icon={Trash2}
                  className="text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                  onClick={() => {
                    deleteEdge(contextEdge);
                    setContextMenuPos(null);
                  }}
                >
                  Delete
                </ContextMenuItem>
              )}
            </ContextMenu>
          )}
        </ContextMenuRoot>
        {/* Background context menu for new node */}
        <ContextMenuRoot position={contextMenuPos} menuRef={contextMenuRef}>
          {!contextNode && !contextEdge && (
            <ContextMenu>
              <ContextMenuItem
                icon={Plus}
                onClick={() => {
                  // Convert screen coordinates to Cytoscape coordinates
                  if (cy && contextMenuPos) {
                    const pos = cy.pan() || { x: 0, y: 0 };
                    const zoom = cy.zoom() || 1;
                    const container = cy.container();
                    if (container) { // Null check for container
                      const rect = container.getBoundingClientRect();

                      // Calculate the position in Cytoscape coordinates
                      const cyX = (contextMenuPos.x - rect.left - pos.x) / zoom;
                      const cyY = (contextMenuPos.y - rect.top - pos.y) / zoom;

                      // Check if position is too close to existing nodes and adjust if needed
                      const minDistance = 150; // Minimum distance between nodes
                      let adjustedX = cyX;
                      let adjustedY = cyY;
                      
                      for (const node of nodes) {
                        if (node.position) {
                          const dx = node.position.x - cyX;
                          const dy = node.position.y - cyY;
                          const distance = Math.sqrt(dx * dx + dy * dy);
                          
                          if (distance < minDistance) {
                            // Move the new node away from the existing one
                            const angle = Math.atan2(dy, dx);
                            adjustedX = node.position.x + Math.cos(angle) * minDistance;
                            adjustedY = node.position.y + Math.sin(angle) * minDistance;
                            break;
                          }
                        }
                      }

                      // Find first unused letter
                      const usedLabels = new Set(nodes.map(n => n.id));
                      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                      let letter = null;
                      for (let i = 0; i < alphabet.length; ++i) {
                        if (!usedLabels.has(alphabet[i])) {
                          letter = alphabet[i];
                          break;
                        }
                      }
                      if (letter) {
                        addNode({ id: letter, position: { x: adjustedX, y: adjustedY } });
                      }
                    }
                  }
                  setContextMenuPos(null);
                }}
              >
                New node
              </ContextMenuItem>
            </ContextMenu>
          )}
        </ContextMenuRoot>
      </div>
    </main>
  );
} 