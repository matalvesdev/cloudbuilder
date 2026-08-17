import type { Node } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";

type ConnectionValidationResult = {
  valid: boolean;
  reason?: string;
};

type ConnectionRule = {
  name: string;
  check: (
    source: Node<CanvasNodeData>,
    target: Node<CanvasNodeData>,
    sourceHandle?: string,
  ) => ConnectionValidationResult;
};

// Valid resource type relationships per provider
const VALID_CONNECTIONS: Record<string, Record<string, string[]>> = {
  aws: {
    aws_vpc: ["aws_subnet", "aws_security_group", "aws_internet_gateway", "aws_nat_gateway", "aws_route_table"],
    aws_subnet: ["aws_instance", "aws_db_instance", "aws_autoscaling_group", "aws_nat_gateway", "aws_elb"],
    aws_security_group: ["aws_instance", "aws_db_instance", "aws_elb", "aws_internet_gateway"],
    aws_instance: ["aws_ebs_volume", "aws_elb"],
    aws_db_instance: ["aws_security_group", "aws_subnet"],
    aws_internet_gateway: ["aws_vpc", "aws_route_table"],
    aws_nat_gateway: ["aws_subnet", "aws_route_table"],
    aws_route_table: ["aws_vpc", "aws_subnet"],
    aws_elb: ["aws_instance", "aws_subnet"],
    aws_autoscaling_group: ["aws_subnet", "aws_launch_template"],
    aws_launch_template: ["aws_autoscaling_group"],
  },
  gcp: {
    google_compute_network: ["google_compute_subnetwork", "google_compute_firewall"],
    google_compute_subnetwork: ["google_compute_instance", "google_sql_database_instance", "google_compute_address"],
    google_compute_instance: ["google_compute_disk", "google_compute_address"],
    google_sql_database_instance: ["google_compute_subnetwork"],
    google_compute_firewall: ["google_compute_network"],
    google_compute_disk: ["google_compute_instance"],
    google_compute_address: ["google_compute_instance", "google_compute_subnetwork"],
    google_storage_bucket: ["google_compute_instance"],
  },
  azure: {
    azurerm_virtual_network: ["azurerm_subnet", "azurerm_network_security_group"],
    azurerm_subnet: ["azurerm_linux_virtual_machine", "azurerm_mssql_database"],
    azurerm_linux_virtual_machine: ["azurerm_managed_disk", "azurerm_public_ip"],
    azurerm_mssql_database: ["azurerm_subnet"],
    azurerm_network_security_group: ["azurerm_virtual_network", "azurerm_subnet"],
    azurerm_managed_disk: ["azurerm_linux_virtual_machine"],
    azurerm_public_ip: ["azurerm_linux_virtual_machine"],
  },
  k8s: {
    kubernetes_namespace: ["kubernetes_deployment", "kubernetes_service", "kubernetes_config_map"],
    kubernetes_deployment: ["kubernetes_service", "kubernetes_config_map", "kubernetes_secret"],
    kubernetes_service: ["kubernetes_deployment"],
    kubernetes_config_map: ["kubernetes_deployment"],
    kubernetes_secret: ["kubernetes_deployment"],
    kubernetes_ingress: ["kubernetes_service"],
  },
};

const connectionRules: ConnectionRule[] = [
  {
    name: "self-connection",
    check: (source, target) => {
      if (source.id === target.id) {
        return { valid: false, reason: "Não é possível conectar um componente a ele mesmo" };
      }
      return { valid: true };
    },
  },
  {
    name: "provider-match",
    check: (source, target) => {
      const srcProvider = source.data.provider;
      const tgtProvider = target.data.provider;
      if (srcProvider && tgtProvider && srcProvider !== tgtProvider) {
        // Allow cross-provider connections (e.g., K8s → GCP VM)
        return { valid: true };
      }
      return { valid: true };
    },
  },
  {
    name: "resource-compatibility",
    check: (source, target) => {
      const srcProvider = source.data.provider;
      const tgtProvider = target.data.provider;
      const srcType = source.data.resourceType;
      const tgtType = target.data.resourceType;

      if (!srcType || !tgtType) return { valid: true };

      const providerRules = VALID_CONNECTIONS[srcProvider];
      if (!providerRules) return { valid: true }; // Unknown provider — allow

      const allowedTargets = providerRules[srcType];
      if (!allowedTargets) return { valid: true }; // No rules for this type — allow

      if (allowedTargets.includes(tgtType)) {
        return { valid: true };
      }

      // Check reverse direction
      const reverseRules = VALID_CONNECTIONS[tgtProvider || srcProvider];
      if (reverseRules) {
        const reverseTargets = reverseRules[tgtType];
        if (reverseTargets?.includes(srcType)) {
          return { valid: true };
        }
      }

      return {
        valid: false,
        reason: `Conexão não suportada: ${srcType} → ${tgtType}`,
      };
    },
  },
  {
    name: "duplicate-prevention",
    check: (source, target) => {
      // This is handled in the CanvasView onConnectWithValidation
      return { valid: true };
    },
  },
];

export function validateConnection(
  source: Node<CanvasNodeData>,
  target: Node<CanvasNodeData>,
  sourceHandle?: string,
): ConnectionValidationResult {
  for (const rule of connectionRules) {
    const result = rule.check(source, target, sourceHandle);
    if (!result.valid) return result;
  }
  return { valid: true };
}
