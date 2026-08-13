import { useCallback, useRef, useState, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Native resizable panel group (no react-resizable-panels) ─────────
// Uses CSS Grid with a draggable separator between panels.
// Supports horizontal (default) and vertical orientations.

interface ResizablePanelGroupProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
}

export function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  children,
}: ResizablePanelGroupProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ResizablePanel({
  className,
  defaultSize,
  minSize,
  ...props
}: React.ComponentProps<"div"> & { defaultSize?: number; minSize?: number }) {
  return <div className={cn("overflow-auto", className)} {...props} />;
}

interface ResizableHandleProps extends React.ComponentProps<"div"> {
  withHandle?: boolean;
  orientation?: "horizontal" | "vertical";
}

export function ResizableHandle({
  withHandle,
  className,
  orientation = "horizontal",
  ...props
}: ResizableHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handle = handleRef.current;
    if (!handle) return;

    const container = handle.parentElement;
    if (!container) return;

    const prev = handle.previousElementSibling as HTMLElement | null;
    const next = handle.nextElementSibling as HTMLElement | null;
    if (!prev || !next) return;

    const onMouseMove = (e: MouseEvent) => {
      const containerRect = container.getBoundingClientRect();
      if (orientation === "horizontal") {
        const ratio = (e.clientX - containerRect.left) / containerRect.width;
        const clamped = Math.max(0.15, Math.min(0.85, ratio));
        prev.style.width = `${clamped * 100}%`;
        prev.style.flex = "none";
        next.style.flex = "1 1 0%";
      } else {
        const ratio = (e.clientY - containerRect.top) / containerRect.height;
        const clamped = Math.max(0.15, Math.min(0.85, ratio));
        prev.style.height = `${clamped * 100}%`;
        prev.style.flex = "none";
        next.style.flex = "1 1 0%";
      }
    };

    const onMouseUp = () => setDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, orientation]);

  return (
    <div
      ref={handleRef}
      onMouseDown={onMouseDown}
      className={cn(
        "relative flex items-center justify-center bg-slate-200 transition-colors",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
        dragging && "bg-slate-300",
        orientation === "horizontal"
          ? "w-px cursor-col-resize"
          : "h-px cursor-row-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-slate-50">
          <GripVertical className="h-2.5 w-2.5 text-slate-500" />
        </div>
      )}
    </div>
  );
}
