// Types for graph nodes and edges

export interface GraphNodeData {
  label?: string
  color?: string
}

export interface GraphNode {
  id: string
  position?: { x: number; y: number }
  data: GraphNodeData
  type: string
  style?: {
    background?: string
  }
}

export type EdgePattern = 'solid' | 'dashed' | 'dotted'

export interface GraphEdgeData {
  label?: string
  color?: string
  width?: number
  pattern?: EdgePattern
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  data: GraphEdgeData
  style?: {
    stroke?: string
    strokeWidth?: number
  }
  directed?: boolean // true for ->, false for --
}

// DOT AST types (minimal, based on dotparser output)
export interface DotAttr {
  type: 'attr'
  id: string
  eq: string
}

export interface DotNodeStmt {
  type: 'node_stmt'
  node_id: { id: string }
  attr_list: DotAttr[]
}

export interface DotEdgeStmt {
  type: 'edge_stmt'
  edge_list: { id: string }[]
  attr_list: DotAttr[]
}

export interface DotSubgraph {
  type: 'subgraph'
  children: DotAstNode[]
}

export type DotAstNode = DotNodeStmt | DotEdgeStmt | DotSubgraph

export interface DotGraph {
  children: DotAstNode[]
}

// For dotAstToCytoscape
export type DotAst = DotGraph[]
