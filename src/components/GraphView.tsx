import CytoscapeComponent from 'react-cytoscapejs'
import { Plus, Trash2, Edit3, RotateCcw, Target, X, Minus } from 'lucide-react'
import { useGraphContext } from '../contexts/GraphContext/GraphContext'
import { useTheme } from '../contexts/ThemeContext/ThemeContext'
import type cytoscape from 'cytoscape'
import { stringToColor } from '../utils/graphDot'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useCytoscapeInteractions } from '../hooks/useCytoscapeInteractions'
import { ContextMenu, ContextMenuItem, ContextMenuRoot } from './ui/context-menu'
import { useHotkeys } from 'react-hotkeys-hook'

interface GraphViewProps {
  sidebarOpen: boolean
  isMobile: boolean
}

export function GraphView({ sidebarOpen, isMobile }: GraphViewProps) {
  const { nodes, edges, deleteNode, deleteEdge, addNode, renameNode } = useGraphContext()
  const { dark } = useTheme()
  const [cy, setCy] = useState<cytoscape.Core | undefined>(undefined)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [isLayoutRunning, setIsLayoutRunning] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // Focus mode: show only nodes within N hops of a selected node
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [focusDepth, setFocusDepth] = useState<number>(1)

  const sanitizeNodeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Function to manually trigger layout
  const triggerLayout = useCallback(() => {
    if (cy) {
      setIsLayoutRunning(true)
      const layout = cy.layout({
        name: 'cose',
        fit: true,
      })

      layout.on('layoutstop', () => {
        setIsLayoutRunning(false)
      })

      layout.run()
    }
  }, [cy])

  const applyFocus = useCallback(
    (nodeId: string | null, depth: number) => {
      if (!cy) return

      // Clear focus
      if (!nodeId) {
        cy.elements().removeClass('focus-hidden')
        return
      }

      const root = cy.getElementById(nodeId)
      if (!root || root.empty()) return

      // Build subgraph within N hops
      let sub = root.union(root.connectedEdges())
      for (let i = 0; i < depth; i++) {
        sub = sub.union(sub.neighborhood())
      }

      cy.elements().addClass('focus-hidden')
      sub.removeClass('focus-hidden')
    },
    [cy],
  )

  useEffect(() => {
    applyFocus(focusNodeId, focusDepth)
  }, [applyFocus, focusNodeId, focusDepth])

  const {
    contextNode,
    contextEdge,
    contextMenuPos,
    edgeSource,
    renamingNode,
    setContextMenuPos,
    setEdgeSource,
    setRenamingNode,
  } = useCytoscapeInteractions(cy)
  const sanitizedRenameId = sanitizeNodeId(renameValue)
  const hasDuplicateId =
    !!renamingNode &&
    sanitizedRenameId.length > 0 &&
    sanitizedRenameId !== renamingNode &&
    nodes.some(n => n.id === sanitizedRenameId)
  const renameError =
    sanitizedRenameId.length === 0
      ? 'ID must include at least one letter or number.'
      : hasDuplicateId
        ? 'ID already exists.'
        : ''

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenuPos(null)
    if (contextMenuPos) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenuPos, setContextMenuPos])

  // Reset rename value when dialog closes
  useEffect(() => {
    if (!renamingNode) {
      setRenameValue('')
    }
  }, [renamingNode])

  // Run layout on initial load
  useEffect(() => {
    if (cy && nodes.length > 0) {
      triggerLayout()
    }
  }, [cy, nodes.length, triggerLayout]) // Only run when cy is first set

  // Keyboard shortcuts using react-hotkeys-hook
  useHotkeys(
    'l',
    e => {
      // Only trigger layout if we have a graph and no input is focused
      // Also check that no modifier keys are pressed (cmd, ctrl, alt, shift)
      if (cy && nodes.length > 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        console.log('Triggering layout from hotkey...')
        triggerLayout()
      }
    },
    {
      enableOnFormTags: false, // Don't trigger when in input fields
      preventDefault: false, // Let us handle preventDefault manually
      enableOnContentEditable: false, // Don't trigger when in contenteditable elements
    },
    [cy, nodes.length, triggerLayout],
  )

  return (
    <main
      className={`flex-1 flex flex-col items-stretch relative bg-neutral-100 dark:bg-neutral-900 min-w-0 min-h-0 overflow-hidden ${!isMobile && sidebarOpen ? 'ml-80' : ''} transition-all duration-200`}
      style={{ minHeight: '60vh', height: '100%' }}
      tabIndex={0}
      onClick={e => {
        // Focus the main container when clicked
        if (e.target === e.currentTarget) {
          e.currentTarget.focus()
        }
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          minHeight: '60vh',
          height: '100%',
          minWidth: 0,
        }}
      >
        <CytoscapeComponent
          elements={[
            ...nodes.map(n => {
              // Use id as label if label is missing
              const label = n.data.label ?? n.id
              return {
                ...n,
                data: {
                  id: n.id,
                  label,
                  color: n.data.color ?? stringToColor(label), // hash-based color
                },
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
              },
            })),
          ]}
          style={{
            width: '80vw',
            height: '100%',
            minHeight: 400,
            background: dark ? '#23272f' : '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 12px #0001',
            minWidth: 0,
          }}
          container={{ className: 'cytoscape-container' }}
          cy={(cyInstance: cytoscape.Core) => {
            setCy(cyInstance)
          }}
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
            animate: true,
          }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                'background-color': 'data(color)',
                label: 'data(label)',
                color: '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 22,
                'font-weight': 700,
                'border-width': 3,
                'border-color': '#fff4',
                'border-opacity': 1,
                'border-style': 'solid',
                'text-shadow': '0 2px 8px #000a',
                'box-shadow': '0 4px 24px #0002',
                shape: 'roundrectangle',
                'background-opacity': 1,
                'text-wrap': 'wrap',
                'text-max-width': '200px',
                width: 'label',
                height: 'label',
                padding: '10px',
                'padding-relative-to': 'width',
              },
            },
            {
              selector: '.focus-hidden',
              style: {
                opacity: 0.08,
                'text-opacity': 0,
                'line-opacity': 0.05,
                'target-arrow-opacity': 0.05,
                'z-index': 0,
              },
            },
            {
              selector: 'edge',
              style: {
                width: 4,
                'line-color': '#bdbdbd',
                'target-arrow-color': '#bdbdbd',
                'curve-style': 'bezier',
                label: 'data(label)',
                'font-size': 16,
                color: '#a5b4fc',
                'target-arrow-shape': 'none',
                opacity: 0.95,
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
        />

        {/* Focus mode indicator */}
        {focusNodeId && (
          <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg z-10 flex items-center gap-3">
            <Target className="w-4 h-4" />
            <div className="text-sm">
              <div className="font-medium">Focus: {focusNodeId}</div>
              <div className="opacity-90">{focusDepth} hop{focusDepth === 1 ? '' : 's'}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded hover:bg-white/10"
                title="Decrease hops"
                onClick={() => setFocusDepth(d => Math.max(1, d - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-white/10"
                title="Increase hops"
                onClick={() => setFocusDepth(d => Math.min(10, d + 1))}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-white/10"
                title="Clear focus"
                onClick={() => setFocusNodeId(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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

        {/* Mobile layout trigger button */}
        {isMobile && nodes.length > 0 && (
          <button
            onClick={triggerLayout}
            disabled={isLayoutRunning}
            className="absolute bottom-4 left-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-full shadow-lg z-10 transition-colors duration-200"
            title="Re-layout graph"
          >
            <RotateCcw className={`w-5 h-5 ${isLayoutRunning ? 'animate-spin' : ''}`} />
          </button>
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
                      setEdgeSource(contextNode)
                      setContextMenuPos(null)
                    }}
                  >
                    New edge
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={Edit3}
                    onClick={() => {
                      const node = nodes.find(n => n.id === contextNode)
                      setRenameValue(node?.data.label || contextNode)
                      setRenamingNode(contextNode)
                      setContextMenuPos(null)
                    }}
                  >
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={Target}
                    onClick={() => {
                      setFocusNodeId(contextNode)
                      setFocusDepth(1)
                      setContextMenuPos(null)
                    }}
                  >
                    Focus (1 hop)
                  </ContextMenuItem>
                  {focusNodeId && (
                    <ContextMenuItem
                      icon={X}
                      onClick={() => {
                        setFocusNodeId(null)
                        setContextMenuPos(null)
                      }}
                    >
                      Clear focus
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem
                    icon={Trash2}
                    className="text-red-400 hover:bg-red-900/20"
                    onClick={() => {
                      deleteNode(contextNode)
                      setContextMenuPos(null)
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
                    deleteEdge(contextEdge)
                    setContextMenuPos(null)
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
                    const pos = cy.pan() || { x: 0, y: 0 }
                    const zoom = cy.zoom() || 1
                    const container = cy.container()
                    if (container) {
                      // Null check for container
                      const rect = container.getBoundingClientRect()

                      // Calculate the position in Cytoscape coordinates
                      const cyX = (contextMenuPos.x - rect.left - pos.x) / zoom
                      const cyY = (contextMenuPos.y - rect.top - pos.y) / zoom

                      // Check if position is too close to existing nodes and adjust if needed
                      const minDistance = 150 // Minimum distance between nodes
                      let adjustedX = cyX
                      let adjustedY = cyY

                      for (const node of nodes) {
                        if (node.position) {
                          const dx = node.position.x - cyX
                          const dy = node.position.y - cyY
                          const distance = Math.sqrt(dx * dx + dy * dy)

                          if (distance < minDistance) {
                            // Move the new node away from the existing one
                            const angle = Math.atan2(dy, dx)
                            adjustedX = node.position.x + Math.cos(angle) * minDistance
                            adjustedY = node.position.y + Math.sin(angle) * minDistance
                            break
                          }
                        }
                      }

                      // Find first unused letter
                      const usedLabels = new Set(nodes.map(n => n.id))
                      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                      let letter = null
                      for (let i = 0; i < alphabet.length; ++i) {
                        if (!usedLabels.has(alphabet[i])) {
                          letter = alphabet[i]
                          break
                        }
                      }
                      if (letter) {
                        addNode({ id: letter, position: { x: adjustedX, y: adjustedY } })
                      }
                    }
                  }
                  setContextMenuPos(null)
                }}
              >
                New node
              </ContextMenuItem>
            </ContextMenu>
          )}
        </ContextMenuRoot>

        {/* Rename Node Dialog */}
        {renamingNode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Rename Node
              </h3>
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (!renamingNode || renameError) return
                    const newLabel = (e.target as HTMLInputElement).value
                    renameNode(renamingNode, sanitizedRenameId, newLabel)
                    setRenamingNode(null)
                  } else if (e.key === 'Escape') {
                    setRenamingNode(null)
                  }
                }}
              />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                ID: <span className="font-mono">{sanitizedRenameId || '—'}</span>
              </div>
              {renameError && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">{renameError}</div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setRenamingNode(null)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!renamingNode || renameError) return
                    renameNode(renamingNode, sanitizedRenameId, renameValue)
                    setRenamingNode(null)
                  }}
                  disabled={!!renameError || !renamingNode}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:text-gray-200 transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
