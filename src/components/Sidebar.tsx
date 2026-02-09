import MonacoEditor from '@monaco-editor/react'
import { Copy, Network } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext/ThemeContext'
import * as Dialog from '@radix-ui/react-dialog'
import { useDotDraft } from '../hooks/useDotDraft'
import { useGraphContext } from '../contexts/GraphContext/GraphContext'
import ShareDialog from './ShareDialog'
import DotGuideDialog from './DotGuideDialog'
import pkg from '../../package.json'
import { useState } from 'react'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isMobile: boolean
}

export function Sidebar({ sidebarOpen, setSidebarOpen, isMobile }: SidebarProps) {
  const { dark } = useTheme()
  const { nodes, edges, setNodes, setEdges, copyLink } = useGraphContext()
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isDotGuideOpen, setIsDotGuideOpen] = useState(false)
  // Link copied state is handled inside ShareDialog
  const {
    dotDraft,
    dotDraftError,
    handleDotChange,
    onSave,
    dotValue,
    // dotError, // removed unused
  } = useDotDraft({ nodes, edges, setNodes, setEdges })

  const handleCopyLink = async () => {
    return await copyLink()
  }

  const openShareDialog = () => {
    setIsShareDialogOpen(true)
  }

  const handleDialogShare = async () => {
    return await handleCopyLink()
  }

  const handleNewGraph = () => {
    setNodes([])
    setEdges([])
  }

  if (isMobile) {
    return (
      <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Dialog.Trigger asChild>
          {!sidebarOpen && (
            <button
              className="absolute left-3 top-3 z-20 bg-indigo-600 text-white rounded-md px-4 py-2 font-semibold shadow-md flex items-center gap-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Network className={dark ? 'mr-1 text-white' : 'mr-1 text-indigo-500'} /> Menu
            </button>
          )}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-30" />
          <Dialog.Content className="fixed left-0 top-0 h-full w-4/5 max-w-[320px] bg-white dark:bg-neutral-900 shadow-2xl z-40 flex flex-col">
            <button
              className="absolute right-3 top-3 text-3xl text-indigo-500"
              onClick={() => setSidebarOpen(false)}
            >
              &times;
            </button>
            <div className="px-5 pt-8 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2 text-left relative">
              <div className="flex items-center gap-2">
                <Network size={28} className={dark ? 'text-white' : 'text-indigo-500'} />
                <span
                  className={
                    dark ? 'font-bold text-xl text-white' : 'font-bold text-xl text-neutral-900'
                  }
                >
                  polycule graph
                </span>
              </div>
              <span
                className={
                  dark
                    ? 'font-medium text-xs text-indigo-300'
                    : 'font-medium text-xs text-indigo-400'
                }
              >
                v{pkg.version}
              </span>
              {/*
              <button
                onClick={toggle}
                className="absolute right-2 top-2 p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-500" />}
              </button>
              */}
            </div>
            {/* Monaco DOT Editor in sidebar */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 flex flex-col">
              <div
                className={
                  dark
                    ? 'font-semibold text-indigo-300 mb-2 text-sm tracking-wide'
                    : 'font-semibold text-indigo-600 mb-2 text-sm tracking-wide'
                }
              >
                DOT Markup
              </div>
              <div
                style={{
                  border: `2px solid ${dotDraftError ? '#e11d48' : dark ? '#23272f' : '#23272f'}`,
                  borderRadius: 8,
                }}
              >
                <MonacoEditor
                  height="260px"
                  defaultLanguage="plaintext"
                  theme={dark ? 'vs-dark' : 'light'}
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
              {dotDraftError && (
                <div className="text-red-500 text-xs mt-2 font-semibold">{dotDraftError}</div>
              )}

              <button
                type="button"
                onClick={() => setIsDotGuideOpen(true)}
                className="mt-2 text-left text-xs font-semibold text-indigo-500 hover:text-indigo-600 underline"
              >
                Guide: DOT fields (label/color/edge styles/positions)
              </button>
              <DotGuideDialog open={isDotGuideOpen} onOpenChange={setIsDotGuideOpen} />

              <button
                onClick={onSave}
                disabled={!!dotDraftError || dotDraft === dotValue}
                className={`mt-3 bg-indigo-600 text-white rounded-md px-4 py-2 font-semibold w-full transition-opacity ${!!dotDraftError || dotDraft === dotValue ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Update
              </button>
              <button
                onClick={handleNewGraph}
                className="mt-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md px-4 py-2 font-semibold w-full transition-colors"
              >
                New
              </button>
            </div>
            <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
              <button
                onClick={openShareDialog}
                title="Copy shareable link"
                className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-4 py-2 font-semibold w-full"
              >
                <Copy size={18} /> Share
              </button>
              <ShareDialog
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                onShare={handleDialogShare}
              />
            </div>
            <div
              className={
                dark
                  ? 'py-3 text-center text-xs text-indigo-200 font-medium'
                  : 'py-3 text-center text-xs text-indigo-400 font-medium'
              }
            >
              <a
                href="https://github.com/Corvimia/polycule-graph/issues/new/choose"
                target="_blank"
                rel="noreferrer"
                className={
                  dark ? 'text-white underline font-bold' : 'text-indigo-600 underline font-bold'
                }
              >
                feedback
              </a>{' '}
              • made with love by{' '}
              <a
                href="https://github.com/Corvimia"
                target="_blank"
                rel="noreferrer"
                className={
                  dark ? 'text-white underline font-bold' : 'text-indigo-600 underline font-bold'
                }
              >
                mia<span className="text-base">✨</span>
              </a>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
  // Desktop sidebar
  return (
    <aside className="w-80 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full shadow-lg z-20 fixed left-0 top-0">
      <div className="px-5 pt-8 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2 text-left relative">
        <div className="flex items-center gap-2">
          <Network size={32} className={dark ? 'text-white' : 'text-indigo-500'} />
          <span
            className={
              dark
                ? 'font-extrabold text-2xl text-white tracking-tight drop-shadow'
                : 'font-extrabold text-2xl text-neutral-900 tracking-tight'
            }
          >
            polycule graph
          </span>
        </div>
        <span
          className={
            dark ? 'font-medium text-xs text-indigo-300' : 'font-medium text-xs text-indigo-400'
          }
        >
          {pkg.version}
        </span>
        {/*
        <button
          onClick={toggle}
          className="absolute right-2 top-2 p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-500" />}
        </button>
        */}
      </div>
      {/* Monaco DOT Editor in sidebar */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col">
        <div
          className={
            dark
              ? 'font-semibold text-indigo-300 mb-2 text-sm tracking-wide uppercase'
              : 'font-semibold text-indigo-600 mb-2 text-sm tracking-wide uppercase'
          }
        >
          DOT Markup
        </div>
        <div
          style={{
            border: `2px solid ${dotDraftError ? '#e11d48' : dark ? '#23272f' : '#23272f'}`,
            borderRadius: 12,
          }}
        >
          <MonacoEditor
            height="260px"
            defaultLanguage="plaintext"
            theme={dark ? 'vs-dark' : 'light'}
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
        {dotDraftError && (
          <div className="text-red-500 text-xs mt-2 font-semibold">{dotDraftError}</div>
        )}

        <button
          type="button"
          onClick={() => setIsDotGuideOpen(true)}
          className="mt-2 text-left text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
        >
          Guide: DOT fields (label/color/edge styles/positions)
        </button>
        <DotGuideDialog open={isDotGuideOpen} onOpenChange={setIsDotGuideOpen} />

        <button
          onClick={onSave}
          disabled={!!dotDraftError || dotDraft === dotValue}
          className={`mt-4 bg-indigo-600 text-white rounded-lg px-4 py-2 font-bold w-full shadow transition-opacity ${!!dotDraftError || dotDraft === dotValue ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Update
        </button>
        <button
          onClick={handleNewGraph}
          className="mt-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-4 py-2 font-bold w-full shadow transition-colors"
        >
          New
        </button>
      </div>
      <div className="px-6 py-4 border-t border-neutral-800 dark:border-neutral-800 bg-[#23272f] dark:bg-[#23272f]">
        <button
          onClick={openShareDialog}
          title="Copy shareable link"
          className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 font-bold w-full shadow"
        >
          <Copy size={18} /> Share
        </button>
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          onShare={handleDialogShare}
        />
      </div>
      <div
        className={
          dark
            ? 'py-3 text-center text-xs text-indigo-300 font-medium'
            : 'py-3 text-center text-xs text-indigo-400 font-medium'
        }
      >
        <a
          href="https://github.com/Corvimia/polycule-graph/issues/new/choose"
          target="_blank"
          rel="noreferrer"
          className={
            dark ? 'text-white underline font-bold' : 'text-indigo-600 underline font-bold'
          }
        >
          feedback
        </a>{' '}
        • made with love by{' '}
        <a
          href="https://github.com/Corvimia"
          target="_blank"
          rel="noreferrer"
          className={
            dark ? 'text-white underline font-bold' : 'text-indigo-600 underline font-bold'
          }
        >
          mia<span className="text-base">✨</span>
        </a>
      </div>
    </aside>
  )
}
