import type { GraphNode, GraphEdge, DotAst, DotAttr, DotAstNode } from '../types'

export function toDot(nodes: GraphNode[], edges: GraphEdge[]): string {
  const graphType = 'graph'
  let dot = `${graphType} G {\n`
  for (const node of nodes) {
    const label = node.data?.label
    const color = node.data?.color ? `color="${node.data.color}"` : ''
    const labelAttr = label && label !== node.id ? `label="${label}"` : ''

    // Persist explicit positions back into DOT so they survive "Update".
    // We use x/y (as requested) rather than graphviz's pos.
    const xAttr = Number.isFinite(node.position?.x) ? `x="${node.position!.x}"` : ''
    const yAttr = Number.isFinite(node.position?.y) ? `y="${node.position!.y}"` : ''

    const attrs = [labelAttr, color, xAttr, yAttr].filter(Boolean).join(', ')
    dot += `  "${node.id}"${attrs ? ` [${attrs}]` : ''};\n`
  }
  for (const edge of edges) {
    const label = edge.data?.label ? `label="${edge.data.label}"` : ''
    const color = edge.data?.color ? `color="${edge.data.color}"` : ''
    const width = edge.data?.width ? `penwidth=${edge.data.width}` : ''
    const pattern =
      edge.data?.pattern && edge.data.pattern !== 'solid' ? `style="${edge.data.pattern}"` : ''
    const attrs = [label, color, width, pattern].filter(Boolean).join(', ')
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

  function parsePos(
    posRaw: string | undefined,
    xRaw?: string | undefined,
    yRaw?: string | undefined,
  ): { x: number; y: number } | undefined {
    // Preferred (app-specific) form: x/y attributes
    if (xRaw != null || yRaw != null) {
      const x = Number.parseFloat(unquote(xRaw ?? ''))
      const y = Number.parseFloat(unquote(yRaw ?? ''))
      if (Number.isFinite(x) && Number.isFinite(y)) return { x, y }
    }

    // Fallback: graphviz-like pos="x,y" (or x,y!)
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
        const pos = parsePos(attrs.pos, attrs.x, attrs.y)
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
              ...(attrs.style ? { pattern: attrs.style as 'solid' | 'dashed' | 'dotted' } : {}),
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

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function toHexByte(n: number): string {
  return Math.round(n).toString(16).padStart(2, '0')
}

// Adapted from the CSS Color Module formulae.
function hslToHex(h: number, sPct: number, lPct: number): string {
  const hNorm = ((h % 360) + 360) % 360
  const s = clamp01(sPct / 100)
  const l = clamp01(lPct / 100)

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1))
  const m = l - c / 2

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hNorm < 60) {
    r1 = c
    g1 = x
  } else if (hNorm < 120) {
    r1 = x
    g1 = c
  } else if (hNorm < 180) {
    g1 = c
    b1 = x
  } else if (hNorm < 240) {
    g1 = x
    b1 = c
  } else if (hNorm < 300) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }

  const r = (r1 + m) * 255
  const g = (g1 + m) * 255
  const b = (b1 + m) * 255

  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
}

export function normalizeColorToHex(color: string | undefined, fallback = '#bdbdbd'): string {
  if (!color) return fallback

  const hexMatch = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hexMatch) {
    const raw = hexMatch[1]
    if (raw.length === 3) {
      const r = raw[0]
      const g = raw[1]
      const b = raw[2]
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
    }
    return `#${raw}`.toLowerCase()
  }

  const hslMatch = color
    .trim()
    .match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i)
  if (hslMatch) {
    const h = Number(hslMatch[1])
    const s = Number(hslMatch[2])
    const l = Number(hslMatch[3])
    if ([h, s, l].every(n => Number.isFinite(n))) {
      return hslToHex(h, s, l)
    }
  }

  return fallback
}

// Hash a string to a color (HEX)
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
  return hslToHex(h, s, l)
}
