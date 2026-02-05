import { useEffect, useCallback, useState } from 'react'
import pako from 'pako'
import type { GraphNode, GraphEdge, DotAst } from '../types'
import { defaultNodes, defaultEdges } from '../utils/graphDefaults'
import { toDot, dotAstToCytoscape } from '../utils/graphDot'
import dotparser from 'dotparser'

const STORAGE_KEY = 'polycule-graph-state'

export function useGraphUrlHash(
  nodes: GraphNode[],
  edges: GraphEdge[],
  setNodes: (nodes: GraphNode[]) => void,
  setEdges: (edges: GraphEdge[]) => void,
) {
  const [isLoaded, setIsLoaded] = useState(false)

  const encodeGraphState = useCallback((nodes: GraphNode[], edges: GraphEdge[]): string => {
    try {
      // Convert to DOT format instead of encoding full arrays
      const dotContent = toDot(nodes, edges)
      const compressed = pako.gzip(dotContent)
      return btoa(String.fromCharCode.apply(null, Array.from(compressed)))
    } catch {
      return ''
    }
  }, [])

  const decodeGraphState = useCallback(
    (str: string): { nodes: GraphNode[]; edges: GraphEdge[] } | null => {
      try {
        const compressed = Uint8Array.from(atob(str), c => c.charCodeAt(0))
        const dotContent = pako.inflate(compressed, { to: 'string' })

        // Parse DOT content back to graph data
        const ast = dotparser(dotContent) as DotAst
        const { nodes, edges } = dotAstToCytoscape(ast)
        return { nodes, edges }
      } catch {
        return null
      }
    },
    [],
  )

  const saveToLocalStorage = useCallback(
    (nodes: GraphNode[], edges: GraphEdge[]) => {
      try {
        const encoded = encodeGraphState(nodes, edges)
        if (encoded) {
          localStorage.setItem(STORAGE_KEY, encoded)
        }
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    },
    [encodeGraphState],
  )

  const loadFromLocalStorage = useCallback((): {
    nodes: GraphNode[]
    edges: GraphEdge[]
  } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return decodeGraphState(stored)
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
    return null
  }, [decodeGraphState])

  // Encode graph state to URL hash and localStorage (only after initial load)
  useEffect(() => {
    if (!isLoaded) return

    const encoded = encodeGraphState(nodes, edges)
    if (encoded) {
      // Update URL hash
      if (window.location.hash !== `#g=${encoded}`) {
        window.history.replaceState(null, '', `#g=${encoded}`)
      }
      // Save to localStorage
      saveToLocalStorage(nodes, edges)
    }
  }, [nodes, edges, encodeGraphState, saveToLocalStorage, isLoaded])

  useEffect(() => {
    const loadGraphFromHash = () => {
      let state: { nodes: GraphNode[]; edges: GraphEdge[] } | null = null

      // Priority 1: Load from URL hash
      if (window.location.hash.startsWith('#g=')) {
        state = decodeGraphState(window.location.hash.slice(3))
      }

      // Priority 2: If no hash or hash failed, load from localStorage
      if (!state) {
        state = loadFromLocalStorage()
      }

      // Priority 3: If no localStorage or localStorage failed, use defaults
      if (state && Array.isArray(state.nodes) && Array.isArray(state.edges)) {
        setNodes(state.nodes)
        setEdges(state.edges)
      } else {
        setNodes(defaultNodes)
        setEdges(defaultEdges)
      }

      // Mark as loaded after setting the initial state
      setIsLoaded(true)
    }

    // Load graph state on initial mount (for page refresh)
    loadGraphFromHash()

    // Listen for hash changes
    const onHashChange = () => {
      loadGraphFromHash()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [decodeGraphState, loadFromLocalStorage, setNodes, setEdges])

  return { encodeGraphState, decodeGraphState }
}
