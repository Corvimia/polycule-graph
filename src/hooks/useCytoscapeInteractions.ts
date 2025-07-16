import { useEffect } from 'react';
import type cytoscape from 'cytoscape';
import { useGraphContext } from '../contexts/GraphContext/GraphContext';

export function useCytoscapeInteractions(cy: cytoscape.Core | undefined) {
  const { setSelected, addNode, nodes } = useGraphContext();

  useEffect(() => {
    if (!cy) return;
    // Remove previous tap handlers to avoid duplicates
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
      // Only trigger if double-tap is on background (not a node/edge)
      if (typeof evt.target.data === 'function' && evt.target.data().id === undefined) {
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
        if (!letter) {
          return; // All letters used
        }
        // Get position from event
        const pos = evt.position;
        addNode({ id: letter, position: pos });
      }
    };

    cy.on('tap', 'node', handleNodeTap);
    cy.on('tap', 'edge', handleEdgeTap);
    cy.on('tap', handleBackgroundTap);
    cy.on('dbltap', handleBackgroundDblTap);

    // Cleanup
    return () => {
      cy.off('tap', 'node', handleNodeTap);
      cy.off('tap', 'edge', handleEdgeTap);
      cy.off('tap', handleBackgroundTap);
      cy.off('dbltap', handleBackgroundDblTap);
    };
  }, [cy, setSelected, addNode, nodes]);
} 