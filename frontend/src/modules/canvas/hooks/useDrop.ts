import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

export function useDrop() {
  const reactFlowInstance = useReactFlow();

  const onDrop = useCallback(
    (event: DragEvent, componentData: any) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: crypto.randomUUID(),
        type: componentData.provider,
        position,
        data: {
          label: componentData.displayName,
          componentDefinitionId: componentData.id,
          provider: componentData.provider,
          resourceType: componentData.resourceType,
          properties: {},
          validationStatus: "PENDING",
        },
      };
      return newNode;
    },
    [reactFlowInstance],
  );

  return { onDrop };
}
