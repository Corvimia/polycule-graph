import { Dialog } from '@radix-ui/react-dialog';
import { Check, X, Share2 } from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void;
}

export function ShareDialog({ open, onOpenChange, onShare }: ShareDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button className="hidden">Open dialog</button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg shadow-2xl z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Your Polycule</h3>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>📢 Your current link has been copied to your clipboard!</p>
              <p className="mt-2">⚠️ Important: This link will <strong>not</strong> update automatically when you make changes.</p>
              <p className="mt-2 text-sm">
                After adding favorites, renaming nodes, or making any changes, you’ll need to click Share again to get an updated link.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onShare}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Share2 size={18} className="mr-2" />
                Share Again
              </button>
              <button 
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ShareDialog;