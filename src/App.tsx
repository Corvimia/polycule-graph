import { useState, useEffect } from 'react'
import './App.css'
// @ts-ignore
import pkg from '../package.json';
const VERSION = pkg.version;
import { useGraph } from './useGraph';
import { Sidebar } from './Sidebar';
import { GraphView } from './GraphView';
import { AppLayout } from './AppLayout';

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

export default function App() {
  const dark = useDarkMode();
  const {
    nodes, edges, selected, setSelected,
    setNodes, setEdges, copyLink
  } = useGraph();

  return (
    <AppLayout
      sidebar={({ sidebarOpen, setSidebarOpen, isMobile }) => (
        <Sidebar
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          copyLink={copyLink}
          VERSION={VERSION}
          dark={dark}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />
      )}
      main={({ sidebarOpen, isMobile }) => (
        <GraphView
          nodes={nodes}
          edges={edges}
          selected={selected}
          setSelected={setSelected}
          dark={dark}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
      )}
    />
  );
}
