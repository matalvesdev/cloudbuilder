package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AwsProviderAdapter implements ProviderAdapter {

    private static final Map<String, String> COMPONENT_IDS = Map.ofEntries(
        Map.entry("aws_vpc", "aws-vpc"),
        Map.entry("aws_subnet", "aws-subnet"),
        Map.entry("aws_instance", "aws-ec2"),
        Map.entry("aws_security_group", "aws-sg"),
        Map.entry("aws_db_instance", "aws-rds"),
        Map.entry("aws_s3_bucket", "aws-s3"),
        Map.entry("aws_lb", "aws-alb"),
        Map.entry("aws_lb_target_group", "aws-tg"),
        Map.entry("aws_ecs_cluster", "aws-ecs"),
        Map.entry("aws_lambda_function", "aws-lambda"),
        Map.entry("aws_sqs_queue", "aws-sqs"),
        Map.entry("aws_sns_topic", "aws-sns"),
        Map.entry("aws_dynamodb_table", "aws-dynamodb"),
        Map.entry("aws_elasticache_cluster", "aws-elasticache"),
        Map.entry("aws_internet_gateway", "aws-igw"),
        Map.entry("aws_nat_gateway", "aws-natgw"),
        Map.entry("aws_route_table", "aws-rtb")
    );

    private static final Map<String, Map<String, String>> PROPERTY_SCHEMAS = Map.of(
        "aws_vpc", Map.of("cidr_block", "CIDR Block", "enable_dns_support", "DNS Support"),
        "aws_instance", Map.of("instance_type", "Instance Type", "ami", "AMI", "key_name", "Key Name"),
        "aws_s3_bucket", Map.of("bucket", "Bucket Name", "acl", "ACL"),
        "aws_db_instance", Map.of("engine", "Engine", "instance_class", "Instance Class", "allocated_storage", "Storage (GB)"),
        "aws_lambda_function", Map.of("function_name", "Function Name", "runtime", "Runtime", "handler", "Handler"),
        "aws_ecs_cluster", Map.of("name", "Cluster Name"),
        "aws_security_group", Map.of("name", "Name", "description", "Description", "vpc_id", "VPC ID")
    );

    @Override
    public String getProviderType() { return "aws"; }

    @Override
    public String getDisplayName() { return "Amazon Web Services"; }

    @Override
    public List<String> getSupportedResourceTypes() {
        return List.copyOf(COMPONENT_IDS.keySet());
    }

    @Override
    public String mapToComponentId(String terraformResourceType) {
        return COMPONENT_IDS.getOrDefault(terraformResourceType, terraformResourceType);
    }

    @Override
    public Map<String, String> getPropertySchema(String resourceType) {
        return PROPERTY_SCHEMAS.getOrDefault(resourceType, Map.of());
    }

    @Override
    public boolean supports(String resourceType) {
        return COMPONENT_IDS.containsKey(resourceType);
    }

    @Override
    public String getTerraformProviderSource() { return "hashicorp/aws"; }

    @Override
    public String getTerraformVersionConstraint() { return ">= 5.0"; }
}
