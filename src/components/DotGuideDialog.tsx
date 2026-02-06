import * as Dialog from '@radix-ui/react-dialog'

export default function DotGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl shadow-2xl p-6 z-50">
          <Dialog.Title className="text-lg font-extrabold">DOT markup guide</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            The editor accepts a small subset of Graphviz DOT. Use this to tweak labels, styles, and
            (optionally) positions.
          </Dialog.Description>

          <div className="mt-4 space-y-4 text-sm leading-6">
            <section>
              <div className="font-bold">Graph header</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-xs">
                {'graph G {\n  "Zoe";\n  "Zoe" -- "Mia";\n}'}
              </pre>
            </section>

            <section>
              <div className="font-bold">Node fields</div>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li>
                  <span className="font-mono">label</span>: display name
                </li>
                <li>
                  <span className="font-mono">color</span>: node color
                </li>
                <li>
                  <span className="font-mono">x</span> / <span className="font-mono">y</span>: explicit position (numbers).
                  If any node has <span className="font-mono">x/y</span>, the graph uses a preset layout.
                </li>
              </ul>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-xs">
                {'"Zoe" [label="Zoe D.", color="#a855f7", x="12", y="-5"];'}
              </pre>
            </section>

            <section>
              <div className="font-bold">Edge fields</div>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li>
                  <span className="font-mono">label</span>: edge label
                </li>
                <li>
                  <span className="font-mono">color</span>: stroke color
                </li>
                <li>
                  <span className="font-mono">penwidth</span>: stroke width (number)
                </li>
                <li>
                  <span className="font-mono">style</span>: <span className="font-mono">solid</span> (default),{' '}
                  <span className="font-mono">dashed</span>, or <span className="font-mono">dotted</span>
                </li>
              </ul>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-xs">
                {'"Zoe" -- "Mia" [label="dating", color="#94a3b8", penwidth=4, style="dashed"];'}
              </pre>
            </section>

            <section>
              <div className="font-bold">Notes</div>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li>
                  Clicking <span className="font-semibold">Update</span> parses the DOT and re-renders the graph.
                </li>
                <li>
                  If you specify <span className="font-mono">x/y</span> on nodes, they will be preserved when you
                  click Update.
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-bold">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
