import MonacoEditor from '@monaco-editor/react';
import { Copy, Network } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useDotDraft } from './useGraph';
import type { GraphNode, GraphEdge } from './types';

interface SidebarProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  copyLink: () => void;
  VERSION: string;
  dark: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function Sidebar({
  nodes,
  edges,
  setNodes,
  setEdges,
  copyLink,
  VERSION,
  dark,
  sidebarOpen,
  setSidebarOpen,
  isMobile,
}: SidebarProps) {
  const {
    dotDraft,
    dotDraftError,
    handleDotChange,
    onSave,
    dotValue,
    // dotError, // removed unused
  } = useDotDraft({ nodes, edges, setNodes, setEdges });

  if (isMobile) {
    return (
      <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Dialog.Trigger asChild>
          {!sidebarOpen && (
            <button className="absolute left-3 top-3 z-20 bg-indigo-600 text-white rounded-md px-4 py-2 font-semibold shadow-md flex items-center gap-2" onClick={() => setSidebarOpen(true)}>
              <Network className="mr-1" /> Menu
            </button>
          )}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-30" />
          <Dialog.Content className="fixed left-0 top-0 h-full w-4/5 max-w-[320px] bg-white dark:bg-neutral-900 shadow-2xl z-40 flex flex-col">
            <button className="absolute right-3 top-3 text-3xl text-indigo-500" onClick={() => setSidebarOpen(false)}>&times;</button>
            <div className="px-5 pt-8 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2 text-left">
              <div className="flex items-center gap-2">
                <Network size={28} className={dark ? 'text-white' : 'text-indigo-500'} />
                <span className="font-bold text-xl text-neutral-900 dark:text-white">polycule graph</span>
              </div>
              <span className="font-medium text-xs text-indigo-400 dark:text-indigo-300">{VERSION}</span>
            </div>
            {/* Monaco DOT Editor in sidebar */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 flex flex-col">
              <div className="font-semibold text-indigo-600 mb-2 text-sm tracking-wide">DOT Markup</div>
              <div style={{ border: `2px solid ${(dotDraftError ? '#e11d48' : '#23272f')}`, borderRadius: 8 }}>
                <MonacoEditor
                  height="260px"
                  defaultLanguage="plaintext"
                  theme="vs-dark"
                  value={dotDraft}
                  onChange={handleDotChange}
                  options={{
                    readOnly: false,
                    fontSize: 15,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'off',
                    padding: { top: 12, bottom: 12 },
                    overviewRulerLanes: 0,
                    scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                    renderLineHighlight: 'none',
                    folding: false,
                    contextmenu: false,
                  }}
                />
              </div>
              {dotDraftError && <div className="text-red-500 text-xs mt-2 font-semibold">{dotDraftError}</div>}
              <button
                onClick={onSave}
                disabled={!!dotDraftError || dotDraft === dotValue}
                className={`mt-3 bg-indigo-600 text-white rounded-md px-4 py-2 font-semibold w-full transition-opacity ${!!dotDraftError || dotDraft === dotValue ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save
              </button>
            </div>
            <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
              <button onClick={copyLink} title="Copy shareable link" className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-4 py-2 font-semibold w-full">
                <Copy size={18} /> Copy Link
              </button>
            </div>
            <div className="py-3 text-center text-xs text-indigo-400 dark:text-indigo-200 font-medium">
              made with love by <a href="#" className="text-indigo-600 dark:text-white underline font-bold">mia<span className="text-base">✨</span></a>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
  // Desktop sidebar
  return (
    <aside className="w-80 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full shadow-lg z-20 fixed left-0 top-0">
      <div className="px-5 pt-8 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2 text-left">
        <div className="flex items-center gap-2">
          <Network size={32} className={dark ? 'text-white' : 'text-indigo-500'} />
          <span className="font-extrabold text-2xl text-white tracking-tight drop-shadow">polycule graph</span>
        </div>
        <span className="font-medium text-xs text-indigo-300">{VERSION}</span>
      </div>
      {/* Monaco DOT Editor in sidebar */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col">
        <div className="font-semibold text-indigo-400 mb-2 text-sm tracking-wide uppercase">DOT Markup</div>
        <div style={{ border: `2px solid ${(dotDraftError ? '#e11d48' : '#23272f')}`, borderRadius: 12 }}>
          <MonacoEditor
            height="260px"
            defaultLanguage="plaintext"
            theme="vs-dark"
            value={dotDraft}
            onChange={handleDotChange}
            options={{
              readOnly: false,
              fontSize: 15,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'off',
              padding: { top: 12, bottom: 12 },
              overviewRulerLanes: 0,
              scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
              renderLineHighlight: 'none',
              folding: false,
              contextmenu: false,
            }}
          />
        </div>
        {dotDraftError && <div className="text-red-500 text-xs mt-2 font-semibold">{dotDraftError}</div>}
        <button
          onClick={onSave}
          disabled={!!dotDraftError || dotDraft === dotValue}
          className={`mt-4 bg-indigo-600 text-white rounded-lg px-4 py-2 font-bold w-full shadow transition-opacity ${!!dotDraftError || dotDraft === dotValue ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Save
        </button>
      </div>
      <div className="px-6 py-4 border-t border-neutral-800 bg-[#23272f]">
        <button onClick={copyLink} title="Copy shareable link" className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 font-bold w-full shadow">
          <Copy size={18} /> Copy Link
        </button>
      </div>
      <div className="py-3 text-center text-xs text-indigo-300 font-medium">
        made with love by <a href="#" className="text-indigo-400 underline font-bold">mia<span className="text-base">✨</span></a>
      </div>
    </aside>
  );
} 