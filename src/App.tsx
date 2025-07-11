import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaLink, FaTrash, FaProjectDiagram, FaRegCopy, FaChevronDown } from 'react-icons/fa';
import dagre from 'dagre';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css'

// Dynamically import version from package.json
// @ts-ignore
import pkg from '../package.json';
const VERSION = pkg.version;

// Theme helpers
function useDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

function getRandomColor() {
  const colors = ['#FFB6C1', '#87CEFA', '#90EE90', '#FFD700', '#FFA07A', '#DDA0DD', '#B0E0E6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper: encode/decode state for URL
function encodeGraphState(nodes: Node[], edges: Edge[]): string {
  try {
    const json = JSON.stringify({ nodes, edges });
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}
function decodeGraphState(str: string): { nodes: Node[]; edges: Edge[] } | null {
  try {
    const json = decodeURIComponent(atob(str));
    const { nodes, edges } = JSON.parse(json);
    return { nodes, edges };
  } catch {
    return null;
  }
}

export default function App() {
  const dark = useDarkMode();
  // React Flow state
  // On load, check URL hash for state
  let initialNodes: Node[] = [
    { id: 'Alice', position: { x: 100, y: 100 }, data: { label: 'Alice', color: '#FFB6C1', size: 40 }, type: 'default', style: { background: '#FFB6C1', width: 40, height: 40 } },
    { id: 'Bob', position: { x: 300, y: 100 }, data: { label: 'Bob', color: '#87CEFA', size: 40 }, type: 'default', style: { background: '#87CEFA', width: 40, height: 40 } },
    { id: 'Charlie', position: { x: 500, y: 100 }, data: { label: 'Charlie', color: '#90EE90', size: 40 }, type: 'default', style: { background: '#90EE90', width: 40, height: 40 } },
  ];
  let initialEdges: Edge[] = [
    { id: 'e1', source: 'Alice', target: 'Bob', type: 'default', data: { color: '#888', width: 2 }, style: { stroke: '#888', strokeWidth: 2 } },
    { id: 'e2', source: 'Bob', target: 'Charlie', type: 'default', data: { color: '#888', width: 2 }, style: { stroke: '#888', strokeWidth: 2 } },
  ];
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#g=')) {
    const state = decodeGraphState(window.location.hash.slice(3));
    if (state && Array.isArray(state.nodes) && Array.isArray(state.edges)) {
      initialNodes = state.nodes;
      initialEdges = state.edges;
    }
  }
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState<{ type: 'node' | 'edge'; id: string } | null>(null);
  const [addingEdge, setAddingEdge] = useState<{ from: string | null }>({ from: null });
  // Handler to request centering a node or edge
  const [centerRequest, setCenterRequest] = useState<{ type: 'node' | 'edge'; id: string } | null>(null);

  // Collapsible DOT markup pane
  const [showDot, setShowDot] = useState(false);
  // Sidebar width state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const draggingSidebar = useRef(false);
  // Responsive sidebar (drawer on small screens)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 700);
  // Add edge mode
  const [addEdgeMode, setAddEdgeMode] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<string | null>(null);

  // Responsive: open/close sidebar on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 700) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sidebar drag handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (draggingSidebar.current) {
        let newWidth = e.clientX;
        if (newWidth < 220) newWidth = 220;
        if (newWidth > 400) newWidth = 400;
        setSidebarWidth(newWidth);
      }
    }
    function onMouseUp() {
      draggingSidebar.current = false;
      document.body.style.cursor = '';
    }
    if (draggingSidebar.current) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    };
  }, [draggingSidebar.current]);

  // Dagre layout for graph
  function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 });
    nodes.forEach(n => g.setNode(n.id, { width: n.data?.size ?? 40, height: n.data?.size ?? 40 }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);
    return nodes.map(n => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x, y: pos.y } };
    });
  }

  // Use dagre layout for display
  const layoutedNodes = useMemo(() => layoutNodes(nodes, edges), [nodes, edges]);

  // Convert React Flow state to DOT
  function rfToDot(nodes: Node[], edges: Edge[]): string {
    const nodeLines = nodes.map(n => `  ${n.id} [label="${n.data?.label ?? n.id}" color="${n.data?.color ?? (dark ? '#fff' : '#222')}" fontcolor="${dark ? '#fff' : '#222'}" style=filled fillcolor="${n.data?.color ?? (dark ? '#23272f' : '#f5f6fa')}" width=${(n.data?.size ?? 40) / 40} fontsize=${(n.data?.size ?? 40) / 2}];`);
    const edgeLines = edges.map(e => `  ${e.source} -- ${e.target} [color="${e.data?.color ?? (dark ? '#fff' : '#222')}" penwidth=${e.data?.width ?? 2}];`);
    return `graph polycule {\n${nodeLines.join('\n')}\n${edgeLines.join('\n')}\n}`;
  }

  const dot = useMemo(() => rfToDot(nodes, edges), [nodes, edges]);
  const [dotError] = useState<string | null>(null);

  // Add edge handler
  const onConnect = (params: Edge | Connection) => {
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', data: { color: '#888', width: 2 }, style: { stroke: '#888', strokeWidth: 2 } }, eds));
    setAddEdgeMode(false);
    setEdgeFrom(null);
  };

  // Add edge mode logic
  const handleAddEdgeClick = () => {
    setAddEdgeMode(true);
    setEdgeFrom(null);
    setSelected(null);
  };
  const handleNodeClick = (_: any, node: Node) => {
    if (addEdgeMode) {
      if (!edgeFrom) {
        setEdgeFrom(node.id);
      } else if (edgeFrom !== node.id) {
        setEdges(eds => [
          ...eds,
          {
            id: `e${edges.length + 1}`,
            source: edgeFrom,
            target: node.id,
            type: 'smoothstep',
            data: { color: '#888', width: 2 },
            style: { stroke: '#888', strokeWidth: 2 },
          },
        ]);
        setAddEdgeMode(false);
        setEdgeFrom(null);
      }
    } else {
      setSelected({ type: 'node', id: node.id });
    }
  };

  // Node/edge selection
  const onNodeClick = (_: any, node: Node) => setSelected({ type: 'node', id: node.id });
  const onEdgeClick = (_: any, edge: Edge) => setSelected({ type: 'edge', id: edge.id });

  // Add node
  const addNode = () => {
    const id = `Node${nodes.length + 1}`;
    const color = getRandomColor();
    setNodes(nds => [
      ...nds,
      {
        id,
        position: { x: 150 + nds.length * 60, y: 200 },
        data: { label: id, color, size: 40 },
        type: 'default',
        style: { background: color, width: 40, height: 40 },
      },
    ]);
  };

  // Start adding edge
  const startAddEdge = () => setAddingEdge({ from: null });
  // When user clicks a node while adding an edge
  const handleAddEdgeNodeClick = (nodeId: string) => {
    if (!addingEdge.from) {
      setAddingEdge({ from: nodeId });
    } else if (addingEdge.from !== nodeId) {
      setEdges(eds => [
        ...eds,
        {
          id: `e${edges.length + 1}`,
          source: addingEdge.from!,
          target: nodeId,
          type: 'default',
          data: { color: '#888', width: 2 },
          style: { stroke: '#888', strokeWidth: 2 },
        },
      ]);
      setAddingEdge({ from: null });
    }
  };

  // Delete node/edge
  const deleteSelected = () => {
    if (!selected) return;
    if (selected.type === 'node') {
      setNodes(nds => nds.filter(n => n.id !== selected.id));
      setEdges(eds => eds.filter(e => e.source !== selected.id && e.target !== selected.id));
    } else {
      setEdges(eds => eds.filter(e => e.id !== selected.id));
    }
    setSelected(null);
  };

  // Update node/edge properties
  const updateNode = (id: string, data: any) => {
    setNodes(nds => nds.map(n => n.id === id ? {
      ...n,
      data: { ...n.data, ...data },
      style: { ...n.style, background: data.color ?? n.data.color, width: data.size ?? n.data.size, height: data.size ?? n.data.size },
    } : n));
  };
  const updateEdge = (id: string, data: any) => {
    setEdges(eds => eds.map(e => e.id === id ? {
      ...e,
      data: { ...e.data, ...data },
      style: { ...e.style, stroke: data.color ?? e.data.color, strokeWidth: data.width ?? e.data.width },
    } : e));
  };

  // Get selected node/edge
  const selectedNode = selected?.type === 'node' ? nodes.find(n => n.id === selected.id) : null;
  const selectedEdge = selected?.type === 'edge' ? edges.find(e => e.id === selected.id) : null;

  // Sidebar: node/edge list
  const nodeList = nodes.map(n => (
    <div
      key={n.id}
      style={{
        marginBottom: 6,
        cursor: 'pointer',
        fontWeight: selected?.type === 'node' && selected.id === n.id ? 700 : 500,
        background: selected?.type === 'node' && selected.id === n.id ? (dark ? '#333' : '#e0e7ff') : 'transparent',
        color: dark ? '#fff' : '#222',
        borderRadius: 6,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        border: addEdgeMode && !edgeFrom ? '2px dashed #6c63ff' : undefined,
        boxShadow: selected?.type === 'node' && selected.id === n.id ? '0 2px 8px #6c63ff22' : undefined,
        outline: addEdgeMode && edgeFrom === n.id ? '2px solid #ffd700' : undefined,
      }}
      onClick={() => {
        if (addEdgeMode) {
          handleNodeClick(null, n);
        } else {
          setSelected({ type: 'node', id: n.id });
          setCenterRequest({ type: 'node', id: n.id });
        }
      }}
    >
      <span style={{ fontSize: 18, marginRight: 8 }}>●</span> {n.data?.label || n.id}
    </div>
  ));
  const edgeList = edges.map(e => (
    <div
      key={e.id}
      style={{
        marginBottom: 6,
        cursor: 'pointer',
        fontWeight: selected?.type === 'edge' && selected.id === e.id ? 700 : 500,
        background: selected?.type === 'edge' && selected.id === e.id ? (dark ? '#333' : '#e0e7ff') : 'transparent',
        color: dark ? '#fff' : '#222',
        borderRadius: 6,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: selected?.type === 'edge' && selected.id === e.id ? '0 2px 8px #6c63ff22' : undefined,
      }}
      onClick={() => {
        setSelected({ type: 'edge', id: e.id });
        setCenterRequest({ type: 'edge', id: e.id });
      }}
    >
      <span style={{ fontSize: 18, marginRight: 8 }}>↔</span> {e.source} -- {e.target}
    </div>
  ));

  // Properties panel (right sidebar)
  const showProperties = !!selectedNode || !!selectedEdge;
  const propertiesSidebar = (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: 320,
        maxWidth: '90vw',
        background: dark ? '#23272f' : '#f8fafc',
        color: dark ? '#fff' : '#222',
        boxShadow: '-2px 0 16px #0002',
        zIndex: 50,
        transition: 'transform 0.3s',
        transform: showProperties ? 'translateX(0)' : 'translateX(100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        borderLeft: dark ? '1px solid #181a20' : '1px solid #e5e7eb',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: '28px 28px 18px 28px', borderBottom: dark ? '1px solid #181a20' : '1px solid #e5e7eb', fontWeight: 700, fontSize: 20 }}>
        {selectedNode ? 'Node Properties' : 'Edge Properties'}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px' }}>
        {selectedNode ? (
          <>
            <div style={{ margin: '18px 0' }}>
              <label style={{ color: dark ? '#fff' : '#222', fontWeight: 500 }}>Label:<br />
                <input
                  value={selectedNode.data?.label ?? ''}
                  onChange={e => updateNode(selectedNode.id, { label: e.target.value })}
                  style={{
                    width: '100%',
                    background: dark ? '#181a20' : '#f5f6fa',
                    color: dark ? '#fff' : '#222',
                    border: `1px solid ${dark ? '#444' : '#bbb'}`,
                    borderRadius: 4,
                    padding: 6,
                    fontSize: 16,
                    marginTop: 4,
                  }}
                />
              </label>
            </div>
            <div style={{ margin: '18px 0' }}>
              <label style={{ color: dark ? '#fff' : '#222', fontWeight: 500 }}>Color:<br />
                <input
                  type="color"
                  value={selectedNode.data?.color ?? '#ccc'}
                  onChange={e => updateNode(selectedNode.id, { color: e.target.value })}
                  style={{
                    width: 40,
                    height: 32,
                    background: 'transparent',
                    border: 'none',
                    marginTop: 4,
                  }}
                />
              </label>
            </div>
            <div style={{ margin: '18px 0' }}>
              <label style={{ color: dark ? '#fff' : '#222', fontWeight: 500 }}>Size:<br />
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={selectedNode.data?.size ?? 40}
                  onChange={e => updateNode(selectedNode.id, { size: Number(e.target.value) })}
                  style={{ width: '80%', marginTop: 4 }}
                />
                <span style={{ marginLeft: 8 }}>{selectedNode.data?.size ?? 40}px</span>
              </label>
            </div>
            <button onClick={deleteSelected} title="Delete Node" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #ff6b6b22', marginTop: 24 }}>
              <FaTrash /> Delete Node
            </button>
          </>
        ) : selectedEdge ? (
          <>
            <div style={{ margin: '18px 0' }}>
              <label style={{ color: dark ? '#fff' : '#222', fontWeight: 500 }}>Color:<br />
                <input
                  type="color"
                  value={selectedEdge.data?.color ?? '#888'}
                  onChange={e => updateEdge(selectedEdge.id, { color: e.target.value })}
                  style={{
                    width: 40,
                    height: 32,
                    background: 'transparent',
                    border: 'none',
                    marginTop: 4,
                  }}
                />
              </label>
            </div>
            <div style={{ margin: '18px 0' }}>
              <label style={{ color: dark ? '#fff' : '#222', fontWeight: 500 }}>Width:<br />
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={selectedEdge.data?.width ?? 2}
                  onChange={e => updateEdge(selectedEdge.id, { width: Number(e.target.value) })}
                  style={{ width: '80%', marginTop: 4 }}
                />
                <span style={{ marginLeft: 8 }}>{selectedEdge.data?.width ?? 2}px</span>
              </label>
            </div>
            <button onClick={deleteSelected} title="Delete Edge" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #ff6b6b22', marginTop: 24 }}>
              <FaTrash /> Delete Edge
            </button>
          </>
        ) : null}
      </div>
    </aside>
  );

  // Sync state to URL hash on change
  useEffect(() => {
    const encoded = encodeGraphState(nodes, edges);
    if (encoded && window.location.hash !== `#g=${encoded}`) {
      window.history.replaceState(null, '', `#g=${encoded}`);
    }
  }, [nodes, edges]);

  // Listen for hash changes (for deeplink navigation)
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
  }, [setNodes, setEdges]);

  // Copy link to clipboard
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh', background: '#f5f6fa', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Responsive/adjustable sidebar */}
        <aside
          ref={sidebarRef}
          style={{
            width: sidebarOpen ? sidebarWidth : 0,
            minWidth: sidebarOpen ? 220 : 0,
            maxWidth: sidebarOpen ? 400 : 0,
            background: dark ? '#181a20' : '#fff',
            borderRight: sidebarOpen ? (dark ? '1px solid #23272f' : '1px solid #e5e7eb') : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            padding: 0,
            boxShadow: sidebarOpen ? '2px 0 8px #0001' : 'none',
            zIndex: 20,
            position: window.innerWidth <= 700 ? 'fixed' : 'relative',
            left: window.innerWidth <= 700 && !sidebarOpen ? -sidebarWidth : 0,
            top: 0,
            height: '100vh',
            transition: 'width 0.2s, left 0.2s',
          }}
        >
          {/* Sidebar drag handle (desktop only) */}
          {sidebarOpen && window.innerWidth > 700 && (
            <div
              onMouseDown={e => {
                draggingSidebar.current = true;
                e.preventDefault();
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 8,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 30,
                background: 'transparent',
              }}
            />
          )}
          {/* Sidebar close button (mobile) */}
          {window.innerWidth <= 700 && sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', right: 12, top: 12, zIndex: 31, background: 'none', border: 'none', fontSize: 28, color: '#6c63ff', cursor: 'pointer' }}>&times;</button>
          )}
          <div style={{ padding: '24px 20px 8px 20px', borderBottom: dark ? '1px solid #23272f' : '1px solid #eee', background: dark ? '#23272f' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'column', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaProjectDiagram size={28} style={{ color: dark ? '#fff' : '#6c63ff' }} />
              <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.5, color: dark ? '#fff' : '#222' }}>polycule graph</span>
            </div>
            <span style={{ fontWeight: 500, fontSize: 14, color: dark ? '#bbb' : '#6c63ff', marginTop: 2 }}>{VERSION}</span>
          </div>
          <div style={{ padding: '18px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={addNode} title="Add Node" style={{ display: 'flex', alignItems: 'center', gap: 8, background: dark ? '#6c63ff' : '#6c63ff', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #6c63ff22' }}>
              <FaPlus /> Add Node
            </button>
            <button onClick={handleAddEdgeClick} title="Add Edge" style={{ display: 'flex', alignItems: 'center', gap: 8, background: addEdgeMode ? '#ffd700' : (dark ? '#23272f' : '#e0e7ff'), color: addEdgeMode ? '#222' : (dark ? '#fff' : '#6c63ff'), border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: addEdgeMode ? '0 2px 8px #ffd70044' : '0 2px 8px #6c63ff11' }}>
              <FaLink /> Add Edge
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 0 20px' }}>
            <div style={{ fontWeight: 600, color: '#6c63ff', marginBottom: 6, fontSize: 15, letterSpacing: 0.2 }}>Nodes</div>
            <div style={{ marginBottom: 16 }}>{nodeList}</div>
            <div style={{ fontWeight: 600, color: '#6c63ff', marginBottom: 6, fontSize: 15, letterSpacing: 0.2 }}>Edges</div>
            <div>{edgeList}</div>
        </div>
          <div style={{ padding: '18px 20px 18px 20px', borderTop: '1px solid #eee', background: dark ? '#23272f' : '#f8fafc' }}>
            <button onClick={copyLink} title="Copy shareable link" style={{ display: 'flex', alignItems: 'center', gap: 8, background: dark ? '#23272f' : '#6c63ff', color: dark ? '#fff' : '#fff', border: 'none', borderRadius: 6, padding: '10px 14px', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%' }}>
              <FaRegCopy /> Copy Link
            </button>
      </div>
          {/* Author attribution */}
          <div style={{ padding: '12px 0 18px 0', textAlign: 'center', fontSize: 14, color: dark ? '#bbb' : '#6c63ff', fontWeight: 500 }}>
            made with love by <a href="#" style={{ color: dark ? '#fff' : '#6c63ff', textDecoration: 'underline', fontWeight: 700 }}>mia<span style={{ fontSize: '1.1em' }}>✨</span></a>
                </div>
        </aside>
        {/* Main Visual Editor Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', position: 'relative', background: dark ? '#181a20' : '#f5f6fa', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          {/* Sidebar open button (mobile) */}
          {window.innerWidth <= 700 && !sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', left: 12, top: 12, zIndex: 21, background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px #6c63ff22' }}>
              <FaProjectDiagram style={{ marginRight: 6 }} /> Menu
            </button>
          )}
          <FlowContent
            nodes={nodes}
            edges={edges}
            layoutedNodes={layoutedNodes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            handleNodeClick={handleNodeClick}
            onEdgeClick={onEdgeClick}
            showProperties={showProperties}
            setSelected={setSelected}
            propertiesSidebar={propertiesSidebar}
            dark={dark}
            centerRequest={centerRequest}
            setCenterRequest={setCenterRequest}
          />
          {/* Collapsible DOT markup pane */}
          <div
            style={{
              width: '100%',
              background: '#23272f',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 15,
              borderTop: '1px solid #222',
              transition: 'max-height 0.3s',
              maxHeight: showDot ? 240 : 36,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: showDot ? '0 -2px 12px #0002' : undefined,
              cursor: 'pointer',
            }}
            onClick={() => setShowDot(v => !v)}
          >
            <button
              tabIndex={-1}
              style={{
                position: 'absolute',
                top: 4,
                right: 16,
                zIndex: 2,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                pointerEvents: 'none',
              }}
            >
              <FaChevronDown style={{ transform: showDot ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
              {showDot ? 'Hide Markup' : 'Show Markup'}
            </button>
            <div style={{ padding: showDot ? '16px 24px 8px 24px' : '8px 24px', whiteSpace: 'pre', opacity: showDot ? 1 : 0.7, pointerEvents: showDot ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
              {dot}
            </div>
          </div>
        </main>
      </div>
    </ReactFlowProvider>
  );
}

function FlowContent({
  nodes,
  edges,
  layoutedNodes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  handleNodeClick,
  onEdgeClick,
  showProperties,
  setSelected,
  propertiesSidebar,
  dark,
  centerRequest,
  setCenterRequest,
}: any) {
  const reactFlowInstance = useReactFlow();
  // Center node/edge on request
  useEffect(() => {
    if (!centerRequest) return;
    if (centerRequest.type === 'node') {
      const node = nodes.find((n: Node) => n.id === centerRequest.id);
      if (node && reactFlowInstance && reactFlowInstance.setCenter) {
        reactFlowInstance.setCenter(
          node.position.x + (node.data?.size ?? 40) / 2,
          node.position.y + (node.data?.size ?? 40) / 2,
          { zoom: 1.5, duration: 400 }
        );
      }
    } else if (centerRequest.type === 'edge') {
      const edge = edges.find((e: Edge) => e.id === centerRequest.id);
      if (edge) {
        const source = nodes.find((n: Node) => n.id === edge.source);
        const target = nodes.find((n: Node) => n.id === edge.target);
        if (source && target && reactFlowInstance && reactFlowInstance.setCenter) {
          const cx = (source.position.x + target.position.x) / 2;
          const cy = (source.position.y + target.position.y) / 2;
          reactFlowInstance.setCenter(cx, cy, { zoom: 1.2, duration: 400 });
        }
      }
    }
    setCenterRequest(null);
    // eslint-disable-next-line
  }, [centerRequest]);

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', borderRadius: 0, margin: 0, boxShadow: 'none', overflow: 'hidden' }}>
      {/* Overlay for dismissing properties sidebar */}
      {showProperties && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: dark ? 'rgba(24,26,32,0.35)' : 'rgba(0,0,0,0.10)',
            zIndex: 40,
            transition: 'background 0.2s',
            cursor: 'pointer',
          }}
        />
      )}
      <ReactFlow
        nodes={layoutedNodes.map((n: Node) => ({
          ...n,
          style: {
            background: n.data?.color ?? (dark ? '#23272f' : '#f5f6fa'),
            color: dark ? '#fff' : '#222',
            border: `2px solid ${dark ? '#fff' : '#222'}`,
            width: n.data?.size ?? 40,
            height: n.data?.size ?? 40,
            fontSize: (n.data?.size ?? 40) / 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            ...n.style,
          },
          data: {
            ...n.data,
            label: <span style={{ fontSize: (n.data?.size ?? 40) / 2, color: dark ? '#fff' : '#222', display: 'block', textAlign: 'center', width: '100%' }}>{n.data?.label ?? n.id}</span>,
          },
        }))}
        edges={edges.map((e: Edge) => ({
          ...e,
          type: 'smoothstep',
          style: {
            stroke: e.data?.color ?? (dark ? '#fff' : '#222'),
            strokeWidth: e.data?.width ?? 2,
            ...e.style,
          },
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        onNodeClick={handleNodeClick}
        onEdgeClick={onEdgeClick}
        selectionOnDrag
        style={{ background: dark ? '#181a20' : '#f5f6fa', borderRadius: 0, minHeight: '100%' }}
      >
        <MiniMap style={{ background: dark ? '#23272f' : '#fff', borderRadius: 6, boxShadow: '0 2px 8px #0001' }} />
        <Controls style={{ left: 'auto', right: 16, top: 16, borderRadius: 6, boxShadow: '0 2px 8px #0001' }} />
        <Background color={dark ? '#23272f' : '#e0e7ff'} gap={24} />
      </ReactFlow>
      {/* Properties sidebar (right) */}
      {propertiesSidebar}
    </div>
  );
}
