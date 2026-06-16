import { Group, Panel, Separator } from 'react-resizable-panels'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

const ResizablePanelGroup = ({ className, orientation, ...props }: React.ComponentProps<typeof Group>) => (
  <Group className={cn('flex h-full w-full', className)} orientation={orientation || 'horizontal'} {...props} />
)

const ResizablePanel = Panel

const ResizableHandle = ({ withHandle, className, ...props }: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) => (
  <Separator
    className={cn('relative flex w-px items-center justify-center bg-slate-200 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:ring-offset-1 data-[resize-handle-active]:bg-slate-300 transition-colors', className)}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-slate-50">
        <GripVertical className="h-2.5 w-2.5 text-slate-500" />
      </div>
    )}
  </Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
