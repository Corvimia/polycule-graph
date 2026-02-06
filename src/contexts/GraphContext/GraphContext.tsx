import { createContext, useContext } from 'react'
import type { GraphNode, GraphEdge } from '../../types'

interface GraphContextType {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selected: { type: 'node' | 'edge'; id: string } | null
  setSelected: (sel: { type: 'node' | 'edge'; id: string } | null) => void
  addNode: (options?: { id?: string; label?: string; position?: { x: number; y: number } }) => void
  addEdge: (source: string, target: string) => void
  updateNode: (id: string, data: Partial<GraphNode['data']>) => void
  setNodePosition: (id: string, position?: { x: number; y: number }) => void
  renameNode: (id: string, nextId: string, label: string) => void
  updateEdge: (id: string, data: Partial<GraphEdge['data']>) => void
  deleteSelected: () => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void
  setNodes: (nodes: GraphNode[]) => void
  setEdges: (edges: GraphEdge[]) => void
  copyLink: () => Promise<boolean>
}

export const GraphContext = createContext<GraphContextType | undefined>(undefined)

export function useGraphContext() {
  const ctx = useContext(GraphContext)
  if (!ctx) throw new Error('useGraphContext must be used within a GraphProvider')
  return ctx
}
