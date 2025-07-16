import '../App.css'
import { Sidebar } from './Sidebar';
import { GraphView } from './GraphView';
import { AppLayout } from './AppLayout';

export default function App() {
  // Use context instead of useGraph
  return (
    <AppLayout
      sidebar={({ sidebarOpen, setSidebarOpen, isMobile }) => (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />
      )}
      main={({ sidebarOpen, isMobile }) => (
        <GraphView
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
      )}
    />
  );
}
