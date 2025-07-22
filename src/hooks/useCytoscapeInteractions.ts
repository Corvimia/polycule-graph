import { useEffect, useState, useRef } from 'react';
import type cytoscape from 'cytoscape';
import { useGraphContext } from '../contexts/GraphContext/GraphContext';

export function useCytoscapeInteractions(cy: cytoscape.Core | undefined) {
  const { setSelected, addNode, addEdge, nodes } = useGraphContext();
  const [contextNode, setContextNode] = useState<string | null>(null);
  const [contextEdge, setContextEdge] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  
  // Long tap state
  const longPressTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const longPressThreshold = 500; // 500ms for long press

  // Debug: log context menu position and edgeSource changes
  useEffect(() => {
    console.log('[useCytoscapeInteractions] contextMenuPos changed:', contextMenuPos);
  }, [contextMenuPos]);
  useEffect(() => {
    console.log('[useCytoscapeInteractions] edgeSource changed:', edgeSource);
  }, [edgeSource]);

  // Helper function to open context menu
  const openContextMenu = (target: cytoscape.NodeSingular | cytoscape.EdgeSingular | null, event: cytoscape.EventObject) => {
    event.preventDefault();
    
    // Get the correct coordinates for both mouse and touch events
    let clientX: number, clientY: number;
    
    if (event.originalEvent instanceof TouchEvent && event.originalEvent.touches.length > 0) {
      // Touch event - use the first touch point
      clientX = event.originalEvent.touches[0].clientX;
      clientY = event.originalEvent.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.originalEvent.clientX;
      clientY = event.originalEvent.clientY;
    }
    
    if (target && target.isNode && target.isNode()) {
      setContextNode(target.id());
      setContextEdge(null);
      console.log('[useCytoscapeInteractions] Context menu opened for node', target.id(), 'at', clientX, clientY);
    } else if (target && target.isEdge && target.isEdge()) {
      setContextEdge(target.id());
      setContextNode(null);
      console.log('[useCytoscapeInteractions] Context menu opened for edge', target.id(), 'at', clientX, clientY);
    } else {
      // Background context menu
      setContextNode(null);
      setContextEdge(null);
      console.log('[useCytoscapeInteractions] Context menu opened for background at', clientX, clientY);
    }
    
    setContextMenuPos({ x: clientX, y: clientY });
  };

  // Node/edge/background selection and double-tap add node
  useEffect(() => {
    if (!cy) return;
    if (typeof cy.off === 'function') cy.off('tap');

    const handleNodeTap = (evt: cytoscape.EventObject) => {
      const node = evt.target.data();
      setSelected({ type: 'node', id: node.id });
    };
    const handleEdgeTap = (evt: cytoscape.EventObject) => {
      const edge = evt.target.data();
      setSelected({ type: 'edge', id: edge.id });
    };
    const handleBackgroundTap = (evt: cytoscape.EventObject) => {
      if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
        setSelected(null);
      }
    };
    const handleBackgroundDblTap = (evt: cytoscape.EventObject) => {
      if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
        const usedLabels = new Set(nodes.map(n => n.id));
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let letter = null;
        for (let i = 0; i < alphabet.length; ++i) {
          if (!usedLabels.has(alphabet[i])) {
            letter = alphabet[i];
            break;
          }
        }
        if (!letter) {
          return;
        }
        const pos = evt.position;
        addNode({ id: letter, position: pos });
      }
    };

    cy.on('tap', 'node', handleNodeTap);
    cy.on('tap', 'edge', handleEdgeTap);
    cy.on('tap', handleBackgroundTap);
    cy.on('dbltap', handleBackgroundDblTap);

    return () => {
      cy.off('tap', 'node', handleNodeTap);
      cy.off('tap', 'edge', handleEdgeTap);
      cy.off('tap', handleBackgroundTap);
      cy.off('dbltap', handleBackgroundDblTap);
    };
  }, [cy, setSelected, addNode, nodes]);

  // Long tap handlers for nodes, edges, and background
  useEffect(() => {
    if (!cy) return;

    const handleNodeLongPressStart = (evt: cytoscape.EventObject) => {
      const nodeId = evt.target.id();
      const timer = setTimeout(() => {
        openContextMenu(evt.target, evt);
        longPressTimers.current.delete(nodeId);
      }, longPressThreshold);
      longPressTimers.current.set(nodeId, timer);
    };

    const handleNodeLongPressEnd = (evt: cytoscape.EventObject) => {
      const nodeId = evt.target.id();
      const timer = longPressTimers.current.get(nodeId);
      if (timer) {
        clearTimeout(timer);
        longPressTimers.current.delete(nodeId);
      }
    };

    const handleEdgeLongPressStart = (evt: cytoscape.EventObject) => {
      const edgeId = evt.target.id();
      const timer = setTimeout(() => {
        openContextMenu(evt.target, evt);
        longPressTimers.current.delete(edgeId);
      }, longPressThreshold);
      longPressTimers.current.set(edgeId, timer);
    };

    const handleEdgeLongPressEnd = (evt: cytoscape.EventObject) => {
      const edgeId = evt.target.id();
      const timer = longPressTimers.current.get(edgeId);
      if (timer) {
        clearTimeout(timer);
        longPressTimers.current.delete(edgeId);
      }
    };

    const handleBackgroundLongPressStart = (evt: cytoscape.EventObject) => {
      // Check if long press is on background (not on node or edge)
      if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
        const backgroundId = 'background';
        const timer = setTimeout(() => {
          openContextMenu(null, evt);
          longPressTimers.current.delete(backgroundId);
        }, longPressThreshold);
        longPressTimers.current.set(backgroundId, timer);
      }
    };

    const handleBackgroundLongPressEnd = (evt: cytoscape.EventObject) => {
      // Check if long press end is on background
      if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
        const backgroundId = 'background';
        const timer = longPressTimers.current.get(backgroundId);
        if (timer) {
          clearTimeout(timer);
          longPressTimers.current.delete(backgroundId);
        }
      }
    };

    // Add long press event listeners
    cy.on('taphold', 'node', handleNodeLongPressStart);
    cy.on('tapend', 'node', handleNodeLongPressEnd);
    cy.on('taphold', 'edge', handleEdgeLongPressStart);
    cy.on('tapend', 'edge', handleEdgeLongPressEnd);
    cy.on('taphold', handleBackgroundLongPressStart);
    cy.on('tapend', handleBackgroundLongPressEnd);

    return () => {
      // Clear any remaining timers
      longPressTimers.current.forEach(timer => clearTimeout(timer));
      longPressTimers.current.clear();

      // Remove event listeners
      cy.off('taphold', 'node', handleNodeLongPressStart);
      cy.off('tapend', 'node', handleNodeLongPressEnd);
      cy.off('taphold', 'edge', handleEdgeLongPressStart);
      cy.off('tapend', 'edge', handleEdgeLongPressEnd);
      cy.off('taphold', handleBackgroundLongPressStart);
      cy.off('tapend', handleBackgroundLongPressEnd);
    };
  }, [cy]);

  // Custom right-click handler for nodes
  useEffect(() => {
    if (!cy) return;
    const handleContextMenu = (evt: cytoscape.EventObject) => {
      if (evt.target.isNode && evt.target.isNode()) {
        openContextMenu(evt.target, evt);
      }
    };
    cy.on('cxttap', 'node', handleContextMenu);
    return () => {
      cy.off('cxttap', 'node', handleContextMenu);
    };
  }, [cy]);

  // Custom right-click handler for edges
  useEffect(() => {
    if (!cy) return;
    const handleEdgeContextMenu = (evt: cytoscape.EventObject) => {
      if (evt.target.isEdge && evt.target.isEdge()) {
        openContextMenu(evt.target, evt);
      }
    };
    cy.on('cxttap', 'edge', handleEdgeContextMenu);
    return () => {
      cy.off('cxttap', 'edge', handleEdgeContextMenu);
    };
  }, [cy]);

  // Custom right-click handler for background (empty space)
  useEffect(() => {
    if (!cy) return;
    const handleBackgroundContextMenu = (evt: cytoscape.EventObject) => {
      // Check if right-click is on background (not on node or edge)
      if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
        openContextMenu(null, evt);
      }
    };
    cy.on('cxttap', handleBackgroundContextMenu);
    return () => {
      cy.off('cxttap', handleBackgroundContextMenu);
    };
  }, [cy]);

  // Edge creation mode: listen for next node tap
  useEffect(() => {
    if (!cy || !edgeSource) return;
    console.log('[useCytoscapeInteractions] Edge creation mode started from node', edgeSource);
    const handleNodeTap = (evt: cytoscape.EventObject) => {
      const targetId = evt.target.id();
      if (targetId && targetId !== edgeSource) {
        addEdge(edgeSource, targetId);
        console.log('[useCytoscapeInteractions] Edge created from', edgeSource, 'to', targetId);
      } else {
        console.log('[useCytoscapeInteractions] Edge creation cancelled or same node clicked');
      }
      setEdgeSource(null);
      console.log('[useCytoscapeInteractions] Edge creation mode exited');
    };
    cy.on('tap', 'node', handleNodeTap);
    return () => {
      cy.off('tap', 'node', handleNodeTap);
    };
  }, [cy, edgeSource, addEdge]);

  // Debug: log when context menu is closed
  useEffect(() => {
    if (contextMenuPos === null) {
      console.log('[useCytoscapeInteractions] Context menu closed');
    }
  }, [contextMenuPos]);

  return {
    contextNode,
    contextEdge,
    contextMenuPos,
    edgeSource,
    setContextMenuPos,
    setEdgeSource,
  };
} 