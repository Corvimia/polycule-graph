import { useState, useMemo } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { Graphviz } from 'graphviz-react'
import './App.css'

// Simple parser: converts lines like 'A -- B' to DOT edges, ignores comments
function textToDot(text: string): string {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
  const nodes = new Set<string>()
  const edges = lines.map(line => {
    const match = line.match(/^(\w+)\s*--\s*(\w+)/)
    if (match) {
      nodes.add(match[1])
      nodes.add(match[2])
      return `  ${match[1]} -- ${match[2]}`
    }
    return null
  }).filter(Boolean)
  return `graph polycule {\n${Array.from(nodes).map(n => `  ${n}`).join('\n')}\n${edges.join('\n')}\n}`
}

export default function App() {
  const [text, setText] = useState(`// Define your polycule here\nAlice -- Bob\nBob -- Charlie`)
  const [dotError, setDotError] = useState<string | null>(null)
  const dot = useMemo(() => {
    try {
      setDotError(null)
      return textToDot(text)
    } catch (e: any) {
      setDotError(e.message || 'Error parsing polycule text')
      return ''
    }
  }, [text])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left: Text Editor */}
      <div style={{ flex: 1, borderRight: '1px solid #eee', minWidth: 0 }}>
        <div style={{ padding: 16 }}>
          <h2>Polycule Text Editor</h2>
          <MonacoEditor
            height="80vh"
            defaultLanguage="plaintext"
            value={text}
            onChange={value => setText(value || '')}
            options={{ fontSize: 16, minimap: { enabled: false } }}
          />
        </div>
      </div>
      {/* Right: Graph Preview */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16 }}>
          <h2>Polycule Graph Preview</h2>
          <div style={{ border: '1px solid #ccc', borderRadius: 8, height: '80vh', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%' }}>
              {dotError ? (
                <div style={{ color: 'red', fontWeight: 500, padding: 24 }}>
                  Error: {dotError}
                </div>
              ) : (
                <Graphviz dot={dot} options={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
