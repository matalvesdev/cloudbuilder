import { useEffect, useRef, useState } from "react";
import { collaborationManager } from "@/services/collaborationManager";

interface RemoteCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

const CURSOR_COLORS = [
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#22c55e",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#6366f1",
  "#f43f5e",
  "#0ea5e9",
];

let colorIndex = 0;
function nextColor(): string {
  return CURSOR_COLORS[colorIndex++ % CURSOR_COLORS.length];
}

/**
 * CursorsOverlay: Renders remote users' cursor positions on the canvas.
 * Subscribes to awareness data broadcast by peers via the WebSocket room.
 */
export function CursorsOverlay() {
  const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const lastSentRef = useRef(0);

  // Listen for awareness messages from the WebSocket
  useEffect(() => {
    if (!collaborationManager.isActive()) return;

    const ws = collaborationManager.getWsAccessor();
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "awareness" && msg.userId && msg.cursor) {
          setCursors((prev) => {
            const next = new Map(prev);
            if (msg.cursor === null) {
              next.delete(msg.userId);
            } else {
              next.set(msg.userId, {
                userId: msg.userId,
                userName: msg.userName || "Usuário",
                x: msg.cursor.x,
                y: msg.cursor.y,
                color: next.get(msg.userId)?.color || nextColor(),
              });
            }
            return next;
          });
        }
        // Presence updates also sync user names
        if (msg.type === "presence" && Array.isArray(msg.users)) {
          setCursors((prev) => {
            const next = new Map(prev);
            for (const u of msg.users) {
              const existing = next.get(u.id);
              if (existing) {
                next.set(u.id, { ...existing, userName: u.name });
              }
            }
            return next;
          });
        }
      } catch {
        // Ignore
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, []);

  // Send our cursor position on mouse move
  useEffect(() => {
    if (!collaborationManager.isActive()) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSentRef.current < 50) return; // Throttle to 20fps
      lastSentRef.current = now;
      collaborationManager.sendCursor({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      collaborationManager.sendCursor(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (cursors.size === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-[top,left] duration-75 ease-linear"
          style={{ left: cursor.x, top: cursor.y }}
        >
          {/* Cursor arrow */}
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path
              d="M1 1L15 15H9.5L7 19L4.5 15H1L1 1Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {/* User label */}
          <div
            className="absolute top-3.5 left-4 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
