---
name: cloudbuilder-frontend
description: Use when working on the CloudBuilder React frontend (React 19, TypeScript, ReactFlow v12 @xyflow/react, Tailwind CSS, Vite). Covers component conventions, node/edge types, canvas patterns, and palette design.
license: MIT
compatibility: opencode
metadata:
  stack: frontend
  framework: react
---

# CloudBuilder Frontend

## Stack
- React 19 + TypeScript + Vite
- @xyflow/react (ReactFlow v12) for the canvas
- Tailwind CSS for styling
- Zustand for state management (@/store/canvasStore)
- lucide-react for icons (NOT Material Icons)
- shadcn/ui components via @/components/ui/

## Conventions
- All UI text in **PT-BR** (labels, tooltips, placeholders, error messages)
- Use `cn()` from `@/lib/utils` for conditional class merging
- Brand colors via tailwind: `brand-navy` (#0a1128), `brand-lime` (#ccff00), `brand-ice-blue` (#E3E2FD)
- `accent-lime` does NOT exist — use `brand-lime` instead

## Canvas Architecture
- **Node types**: `aws`, `azure`, `gcp`, `k8s` (all render `CloudNode` component)
- **Edge types**: `connection` (with `data.edgeType`: `default` | `animated` | `dashed`)
- **Canvas**: `CanvasView.tsx` wraps `<ReactFlow>` with `ReactFlowProvider`
- **Palette sidebar**: `ComponentPalette.tsx` (240px, drag-and-drop)
- **Properties panel**: `PropertiesPanel.tsx` (280px, right side)
- **Node toolbar**: `NodeToolbar.tsx` (ReactFlow's NodeToolbar, appears above selected nodes)
- **Command palette**: `CanvasCommandPalette.tsx` (⌘K)
- **Design module**: `DesignModule.tsx` orchestrates everything

## Key Files
- `src/modules/design/DesignModule.tsx` — main canvas module
- `src/modules/design/components/CanvasView.tsx` — ReactFlow wrapper
- `src/modules/design/components/ComponentPalette.tsx` — sidebar palette
- `src/modules/design/components/PropertiesPanel.tsx` — properties sidebar
- `src/modules/design/nodes/CloudNode.tsx` — unified cloud node renderer
- `src/modules/design/nodes/NodeToolbar.tsx` — floating toolbar on nodes
- `src/modules/design/nodes/providerIcons.tsx` — SVG provider/service icons
- `src/store/canvasStore.ts` — Zustand store (nodes, edges, history, actions)
- `src/types/canvas.types.ts` — TypeScript types

## Provider Colors
- AWS: orange (#FF9900 / #FF6600)
- Azure: blue (#0078D4)
- GCP: blue (#4285F4)
- K8s: indigo (#326CE5)

## Prototype References
- `frontend/prototypes/cloudbuilder-prototype.html` is the authoritative design reference
- Canvas: 240px sidebar | flex canvas | 280px properties panel
- Floating centered toolbar over canvas
- Zoom controls bottom-left, minimap bottom-right
