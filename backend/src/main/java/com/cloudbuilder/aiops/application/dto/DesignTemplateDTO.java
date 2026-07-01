package com.cloudbuilder.aiops.application.dto;

import java.util.List;

public record DesignTemplateDTO(
    String id,
    String name,
    String description,
    List<DesignTemplateResourceDTO> resources,
    List<DesignTemplateConnectionDTO> connections
) {

    /**
     * Pre-defined VPC + ECS + RDS template for AWS.
     */
    public static DesignTemplateDTO vpcEcsRds() {
        return new DesignTemplateDTO(
            "vpc-ecs-rds",
            "VPC + ECS + RDS",
            "Aplicação web em container com banco PostgreSQL gerenciado, isolada em VPC privada.",
            List.of(
                new DesignTemplateResourceDTO("vpc", "VPC", "aws", "vpc", "network"),
                new DesignTemplateResourceDTO("subnet_public", "Subnet Pública", "aws", "subnet", "network"),
                new DesignTemplateResourceDTO("subnet_private", "Subnet Privada", "aws", "subnet", "network"),
                new DesignTemplateResourceDTO("igw", "Internet Gateway", "aws", "internet_gateway", "network"),
                new DesignTemplateResourceDTO("nat_gateway", "NAT Gateway", "aws", "nat_gateway", "network"),
                new DesignTemplateResourceDTO("ecs_cluster", "ECS Cluster", "aws", "ecs_cluster", "compute"),
                new DesignTemplateResourceDTO("ecs_service", "ECS Service (API)", "aws", "ecs_service", "compute"),
                new DesignTemplateResourceDTO("ecs_taskdef", "ECS Task Definition", "aws", "ecs_task_definition", "compute"),
                new DesignTemplateResourceDTO("alb", "Application Load Balancer", "aws", "alb", "network"),
                new DesignTemplateResourceDTO("rds", "RDS PostgreSQL", "aws", "rds_instance", "database"),
                new DesignTemplateResourceDTO("sg_ecs", "Security Group - ECS", "aws", "security_group", "security"),
                new DesignTemplateResourceDTO("sg_rds", "Security Group - RDS", "aws", "security_group", "security")
            ),
            List.of(
                new DesignTemplateConnectionDTO("vpc", "subnet_public", "contains"),
                new DesignTemplateConnectionDTO("vpc", "subnet_private", "contains"),
                new DesignTemplateConnectionDTO("vpc", "igw", "attached"),
                new DesignTemplateConnectionDTO("vpc", "nat_gateway", "attached"),
                new DesignTemplateConnectionDTO("subnet_public", "alb", "hosts"),
                new DesignTemplateConnectionDTO("subnet_public", "nat_gateway", "hosts"),
                new DesignTemplateConnectionDTO("subnet_private", "ecs_cluster", "hosts"),
                new DesignTemplateConnectionDTO("subnet_private", "rds", "hosts"),
                new DesignTemplateConnectionDTO("alb", "ecs_service", "routes_to"),
                new DesignTemplateConnectionDTO("ecs_cluster", "ecs_service", "runs"),
                new DesignTemplateConnectionDTO("ecs_service", "ecs_taskdef", "uses"),
                new DesignTemplateConnectionDTO("ecs_service", "sg_ecs", "uses"),
                new DesignTemplateConnectionDTO("rds", "sg_rds", "uses"),
                new DesignTemplateConnectionDTO("ecs_service", "rds", "depends_on")
            )
        );
    }

    /**
     * Pre-defined Kubernetes cluster template for AWS (EKS).
     */
    public static DesignTemplateDTO kubernetesCluster() {
        return new DesignTemplateDTO(
            "kubernetes-cluster",
            "Kubernetes Cluster (EKS)",
            "Cluster Kubernetes gerenciado na AWS com node groups, ALB ingress e metrics server.",
            List.of(
                new DesignTemplateResourceDTO("vpc", "VPC", "aws", "vpc", "network"),
                new DesignTemplateResourceDTO("subnet_a", "Subnet A (us-east-1a)", "aws", "subnet", "network"),
                new DesignTemplateResourceDTO("subnet_b", "Subnet B (us-east-1b)", "aws", "subnet", "network"),
                new DesignTemplateResourceDTO("eks_cluster", "EKS Cluster", "aws", "eks_cluster", "compute"),
                new DesignTemplateResourceDTO("eks_nodegroup", "EKS Node Group", "aws", "eks_node_group", "compute"),
                new DesignTemplateResourceDTO("eks_addon_vpc_cni", "VPC CNI", "aws", "eks_addon", "network"),
                new DesignTemplateResourceDTO("eks_addon_coredns", "CoreDNS", "aws", "eks_addon", "network"),
                new DesignTemplateResourceDTO("eks_addon_proxy", "kube-proxy", "aws", "eks_addon", "network"),
                new DesignTemplateResourceDTO("alb_ingress", "ALB Ingress Controller", "k8s", "deployment", "network"),
                new DesignTemplateResourceDTO("metrics_server", "Metrics Server", "k8s", "deployment", "monitoring"),
                new DesignTemplateResourceDTO("namespace_apps", "Namespace: apps", "k8s", "namespace", "compute"),
                new DesignTemplateResourceDTO("namespace_monitoring", "Namespace: monitoring", "k8s", "namespace", "monitoring")
            ),
            List.of(
                new DesignTemplateConnectionDTO("vpc", "subnet_a", "contains"),
                new DesignTemplateConnectionDTO("vpc", "subnet_b", "contains"),
                new DesignTemplateConnectionDTO("subnet_a", "eks_cluster", "hosts"),
                new DesignTemplateConnectionDTO("subnet_b", "eks_cluster", "hosts"),
                new DesignTemplateConnectionDTO("eks_cluster", "eks_nodegroup", "manages"),
                new DesignTemplateConnectionDTO("eks_cluster", "eks_addon_vpc_cni", "installs"),
                new DesignTemplateConnectionDTO("eks_cluster", "eks_addon_coredns", "installs"),
                new DesignTemplateConnectionDTO("eks_cluster", "eks_addon_proxy", "installs"),
                new DesignTemplateConnectionDTO("eks_cluster", "alb_ingress", "deploys"),
                new DesignTemplateConnectionDTO("eks_cluster", "metrics_server", "deploys"),
                new DesignTemplateConnectionDTO("eks_cluster", "namespace_apps", "contains"),
                new DesignTemplateConnectionDTO("eks_cluster", "namespace_monitoring", "contains")
            )
        );
    }

    /**
     * Pre-defined Serverless API template (API Gateway + Lambda + DynamoDB).
     */
    public static DesignTemplateDTO serverlessApi() {
        return new DesignTemplateDTO(
            "serverless-api",
            "API Serverless",
            "API REST serverless com API Gateway, Lambda e DynamoDB — sem servidores para gerenciar.",
            List.of(
                new DesignTemplateResourceDTO("api_gateway", "API Gateway REST", "aws", "api_gateway_rest_api", "network"),
                new DesignTemplateResourceDTO("lambda_function", "Lambda Function (API Handler)", "aws", "lambda_function", "compute"),
                new DesignTemplateResourceDTO("lambda_role", "Lambda IAM Role", "aws", "iam_role", "security"),
                new DesignTemplateResourceDTO("dynamodb_table", "DynamoDB Table", "aws", "dynamodb_table", "database"),
                new DesignTemplateResourceDTO("cognito_pool", "Cognito User Pool", "aws", "cognito_user_pool", "security"),
                new DesignTemplateResourceDTO("cloudwatch_logs", "CloudWatch Log Group", "aws", "cloudwatch_log_group", "monitoring")
            ),
            List.of(
                new DesignTemplateConnectionDTO("api_gateway", "lambda_function", "triggers"),
                new DesignTemplateConnectionDTO("lambda_function", "lambda_role", "uses"),
                new DesignTemplateConnectionDTO("lambda_function", "dynamodb_table", "reads_writes"),
                new DesignTemplateConnectionDTO("api_gateway", "cognito_pool", "authenticates_with"),
                new DesignTemplateConnectionDTO("lambda_function", "cloudwatch_logs", "logs_to")
            )
        );
    }
}
