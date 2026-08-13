import { useState } from "react";

export function useCanvasSocket(canvasId: string) {
  const [connected] = useState(false);
  const [lastEvent] = useState<any>(null);

  return { connected, lastEvent };
}
