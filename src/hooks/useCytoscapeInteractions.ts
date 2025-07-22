import { useEffect, useState, useRef } from 'react';
import type cytoscape from 'cytoscape';
import { useGraphContext } from '../contexts/GraphContext/GraphContext';

export function useCytoscapeInteractions(cy: cytoscape.Core | undefined) {
  const { setSelected, addNode, addEdge, nodes } = useGraphContext();
  const [contextNode, setContextNode] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);

  // Debug: log context menu position and edgeSource changes
  useEffect(() => {
    console.log('[useCytoscapeInteractions] contextMenuPos changed:', contextMenuPos);
  }, [contextMenuPos]);
  useEffect(() => {
    console.log('[useCytoscapeInteractions] edgeSource changed:', edgeSource);
  }, [edgeSource]);

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

  // Custom right-click handler for nodes
  useEffect(() => {
    if (!cy) return;
    const handleContextMenu = (evt: cytoscape.EventObject) => {
      if (evt.target.isNode && evt.target.isNode()) {
        evt.preventDefault();
        setContextNode(evt.target.id());
        setContextMenuPos({ x: evt.originalEvent.clientX, y: evt.originalEvent.clientY });
        console.log('[useCytoscapeInteractions] Context menu opened for node', evt.target.id(), 'at', evt.originalEvent.clientX, evt.originalEvent.clientY);
      }
    };
    cy.on('cxttap', 'node', handleContextMenu);
    return () => {
      cy.off('cxttap', 'node', handleContextMenu);
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
    contextMenuPos,
    edgeSource,
    setContextMenuPos,
    setEdgeSource,
  };
} 