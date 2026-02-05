import type { GraphNode, GraphEdge, DotAst, DotAttr, DotAstNode } from '../types'

export function toDot(nodes: GraphNode[], edges: GraphEdge[]): string {
  const graphType = 'graph'
  let dot = `${graphType} G {\n`
  for (const node of nodes) {
    const label = node.data?.label
    const color = node.data?.color ? `color="${node.data.color}"` : ''
    const labelAttr = label && label !== node.id ? `label="${label}"` : ''
    const attrs = [labelAttr, color].filter(Boolean).join(', ')
    dot += `  "${node.id}"${attrs ? ` [${attrs}]` : ''};\n`
  }
  for (const edge of edges) {
    const label = edge.data?.label ? `label="${edge.data.label}"` : ''
    const color = edge.data?.color ? `color="${edge.data.color}"` : ''
    const width = edge.data?.width ? `penwidth=${edge.data.width}` : ''
    const attrs = [label, color, width].filter(Boolean).join(', ')
    dot += `  "${edge.source}" -- "${edge.target}"${attrs ? ` [${attrs}]` : ''};\n`
  }
  dot += '}'
  return dot
}

export function dotAstToCytoscape(ast: DotAst): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeSet = new Set<string>()

  function unquote(value: string): string {
    const v = `${value ?? ''}`
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1)
    }
    return v
  }

  function parsePos(posRaw: string | undefined): { x: number; y: number } | undefined {
    if (!posRaw) return undefined
    // Common Graphviz-ish forms we might see:
    // - "12,34"
    // - "12,34!" (the ! suffix means "pin" in graphviz)
    // - "12,34,0" (3D-ish; ignore the rest)
    const cleaned = unquote(posRaw).trim().replace(/!$/, '')
    const [xStr, yStr] = cleaned.split(',').map(s => s.trim())
    const x = Number.parseFloat(xStr)
    const y = Number.parseFloat(yStr)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined
    return { x, y }
  }

  function getAttrs(attrsArr: DotAttr[]): Record<string, string> {
    const attrs: Record<string, string> = {}
    if (!Array.isArray(attrsArr)) return attrs
    for (const attr of attrsArr) {
      if (attr.type === 'attr') {
        attrs[attr.id] = unquote(attr.eq)
      }
    }
    return attrs
  }

  function walk(children: DotAstNode[]): void {
    for (const child of children) {
      if (child.type === 'node_stmt') {
        const id = child.node_id.id
        nodeSet.add(id)
        const attrs = getAttrs(child.attr_list)
        const label = attrs.label && attrs.label !== id ? attrs.label : undefined
        const pos = parsePos(attrs.pos)
        nodes.push({
          id,
          ...(pos ? { position: pos } : {}),
          data: {
            ...(label ? { label } : {}),
            ...(attrs.color ? { color: attrs.color } : {}),
          },
          type: 'default',
          style: {
            ...(attrs.color ? { background: attrs.color } : {}),
          },
        })
      } else if (child.type === 'edge_stmt') {
        const edgeList = child.edge_list
        const attrs = getAttrs(child.attr_list)
        const directed = false // TODO: support directed edges
        for (let i = 0; i < edgeList.length - 1; ++i) {
          const source = edgeList[i].id
          const target = edgeList[i + 1].id
          nodeSet.add(source)
          nodeSet.add(target)
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
          })
        }
      } else if (child.type === 'subgraph') {
        walk(child.children)
      }
    }
  }

  for (const graph of ast) {
    if (graph.children) walk(graph.children)
  }
  nodeSet.forEach(id => {
    if (!nodes.find(n => n.id === id)) {
      nodes.push({
        id,
        data: {},
        type: 'default',
      })
    }
  })
  return { nodes, edges }
}

// Hash a string to a color (HSL)
export function stringToColor(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i) * (i + 13) // more entropy
  }
  // Add string length and char code sum for more randomness
  const charSum = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const h = Math.abs(hash + charSum * 31) % 360
  const s = 65 + (charSum % 20) // 65-85%
  const l = 55 + (hash % 10) // 55-64%
  return `hsl(${h}, ${s}%, ${l}%)`
}
