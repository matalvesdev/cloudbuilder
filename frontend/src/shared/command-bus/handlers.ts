/**
 * CommandBus handler registry.
 *
 * Registers all command handlers that map command types to API calls.
 * Called once during app initialization in Providers.tsx.
 *
 * Architecture:
 *   Feature Module → CommandBus.dispatch({ type: 'deploy', payload: {...} })
 *   → handler registered here → API call → Backend/Gateway
 */

import { commandBus, type CommandHandler } from "./index";
import { api } from "@/api/client";

/* ─── Canvas Commands ────────────────────────────────────────── */

const createCanvasHandler: CommandHandler<{
  name: string;
  description?: string;
}> = async (cmd) => {
  const data = await api.post("/canvases", cmd.payload);
  return { success: true, data };
};

const updateCanvasHandler: CommandHandler<{
  id: string;
  name?: string;
  description?: string;
}> = async (cmd) => {
  const { id, ...body } = cmd.payload;
  const data = await api.put(`/canvases/${id}`, body);
  return { success: true, data };
};

const deleteCanvasHandler: CommandHandler<{ id: string }> = async (cmd) => {
  await api.delete(`/canvases/${cmd.payload.id}`);
  return { success: true };
};

const addNodeHandler: CommandHandler<{
  canvasId: string;
  type: string;
  positionX: number;
  positionY: number;
  properties?: string;
}> = async (cmd) => {
  const { canvasId, ...body } = cmd.payload;
  const data = await api.post(`/canvases/${canvasId}/nodes`, body);
  return { success: true, data };
};

const removeNodeHandler: CommandHandler<{
  canvasId: string;
  nodeId: string;
}> = async (cmd) => {
  const { canvasId, nodeId } = cmd.payload;
  await api.delete(`/canvases/${canvasId}/nodes/${nodeId}`);
  return { success: true };
};

const addEdgeHandler: CommandHandler<{
  canvasId: string;
  source: string;
  target: string;
  edgeType?: string;
}> = async (cmd) => {
  const { canvasId, ...body } = cmd.payload;
  const data = await api.post(`/canvases/${canvasId}/edges`, body);
  return { success: true, data };
};

const removeEdgeHandler: CommandHandler<{
  canvasId: string;
  edgeId: string;
}> = async (cmd) => {
  const { canvasId, edgeId } = cmd.payload;
  await api.delete(`/canvases/${canvasId}/edges/${edgeId}`);
  return { success: true };
};

const validateCanvasHandler: CommandHandler<{ canvasId: string }> = async (
  cmd,
) => {
  const data = await api.post(`/canvases/${cmd.payload.canvasId}/validate`);
  return { success: true, data };
};

/* ─── Provisioning Commands ──────────────────────────────────── */

const generateCodeHandler: CommandHandler<{
  canvasId: string;
  engine?: string;
}> = async (cmd) => {
  const engine = cmd.payload.engine ?? "terraform";
  const data = await api.post(
    `/canvases/${cmd.payload.canvasId}/generate?engine=${engine}`,
  );
  return { success: true, data };
};

const syncEnvironmentHandler: CommandHandler<{
  environmentId: string;
  stateJson?: string;
}> = async (cmd) => {
  const { environmentId, ...body } = cmd.payload;
  const data = await api.post(`/environments/${environmentId}/sync`, body);
  return { success: true, data };
};

const resolveDriftHandler: CommandHandler<{
  environmentId: string;
  reportId: string;
  resolvedBy?: string;
}> = async (cmd) => {
  const { environmentId, reportId, resolvedBy } = cmd.payload;
  const data = await api.post(
    `/environments/${environmentId}/drift/resolve/${reportId}`,
    { resolvedBy },
  );
  return { success: true, data };
};

/* ─── Deployment Commands ────────────────────────────────────── */

const deployHandler: CommandHandler<{
  environmentId: string;
  version?: string;
}> = async (cmd) => {
  const data = await api.post(
    `/environments/${cmd.payload.environmentId}/deploy`,
    cmd.payload,
  );
  return { success: true, data };
};

/* ─── Cost Commands ──────────────────────────────────────────── */

const createBudgetHandler: CommandHandler<{
  environmentId: string;
  name: string;
  limit: number;
}> = async (cmd) => {
  const data = await api.post("/cost/budgets", cmd.payload);
  return { success: true, data };
};

/* ─── Credential Commands ────────────────────────────────────── */

const createCredentialHandler: CommandHandler<{
  name: string;
  type: string;
  value: string;
}> = async (cmd) => {
  const data = await api.post("/credentials", cmd.payload);
  return { success: true, data };
};

const deleteCredentialHandler: CommandHandler<{ id: string }> = async (cmd) => {
  await api.delete(`/credentials/${cmd.payload.id}`);
  return { success: true };
};

/* ─── Compliance Commands ────────────────────────────────────── */

const createComplianceRuleHandler: CommandHandler<{
  rule: Record<string, unknown>;
}> = async (cmd) => {
  const tenantId =
    localStorage.getItem("cloudbuilder-active-tenant-id") || "default";
  const data = await api.post(
    `/compliance/rules/${tenantId}`,
    cmd.payload.rule,
  );
  return { success: true, data };
};

const deleteComplianceRuleHandler: CommandHandler<{ id: string }> = async (
  cmd,
) => {
  await api.delete(`/compliance/rules/${cmd.payload.id}`);
  return { success: true };
};

/* ─── Handler Registration ───────────────────────────────────── */

export function registerCommandHandlers(): void {
  // Canvas
  commandBus.register("canvas:create", createCanvasHandler);
  commandBus.register("canvas:update", updateCanvasHandler);
  commandBus.register("canvas:delete", deleteCanvasHandler);
  commandBus.register("canvas:addNode", addNodeHandler);
  commandBus.register("canvas:removeNode", removeNodeHandler);
  commandBus.register("canvas:addEdge", addEdgeHandler);
  commandBus.register("canvas:removeEdge", removeEdgeHandler);
  commandBus.register("canvas:validate", validateCanvasHandler);

  // Provisioning
  commandBus.register("provision:generateCode", generateCodeHandler);
  commandBus.register("provision:sync", syncEnvironmentHandler);
  commandBus.register("provision:resolveDrift", resolveDriftHandler);

  // Deployment
  commandBus.register("deployment:deploy", deployHandler);

  // Cost
  commandBus.register("cost:createBudget", createBudgetHandler);

  // Credentials
  commandBus.register("credential:create", createCredentialHandler);
  commandBus.register("credential:delete", deleteCredentialHandler);

  // Compliance
  commandBus.register("compliance:createRule", createComplianceRuleHandler);
  commandBus.register("compliance:deleteRule", deleteComplianceRuleHandler);
}
