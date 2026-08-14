package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignNode;
import com.cloudbuilder.provision.application.dto.GeneratedCode;
import com.cloudbuilder.provision.domain.model.TerraformTemplate;
import com.cloudbuilder.provision.domain.port.TerraformTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodeGeneratorService {

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*(\\w+)\\s*}}");

    private final TerraformTemplateRepository templateRepository;

    private final Map<String, BuiltInTemplate> builtInTemplates = new LinkedHashMap<>();

    public CodeGeneratorService(TerraformTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
        initBuiltInTemplates();
    }

    public GeneratedCode generateCode(CanvasDesign design, String provider, String engine) {
        Map<String, String> files = new LinkedHashMap<>();
        StringBuilder resources = new StringBuilder();
        StringBuilder variableDeclarations = new StringBuilder();
        StringBuilder outputDeclarations = new StringBuilder();
        Set<String> declaredVariables = new LinkedHashSet<>();
        Set<String> declaredOutputs = new LinkedHashSet<>();
        int resourceCount = 0;

        for (DesignNode node : design.nodes()) {
            String templateContent = resolveTemplate(node.resourceType(), node.provider());
            if (templateContent == null) {
                continue;
            }
            String rendered = renderTemplate(templateContent, node.properties(), node.id());
            resources.append(rendered).append("\n\n");
            resourceCount++;

            BuiltInTemplate bt = builtInTemplates.get(node.resourceType());
            if (bt != null) {
                for (VariableDef var : bt.variables()) {
                    if (declaredVariables.add(var.name())) {
                        variableDeclarations.append(generateVariable(var));
                    }
                }
                for (OutputDef out : bt.outputs()) {
                    if (declaredOutputs.add(out.name())) {
                        outputDeclarations.append(generateOutput(out, node.id()));
                    }
                }
            }
        }

        String providerName = (provider != null) ? provider : "aws";
        String providersContent = generateProviders(providerName);
        String versionsContent = generateVersionsForProvider(engine, providerName);

        if (variableDeclarations.isEmpty()) {
            variableDeclarations.append("# No variables defined\n");
        }
        if (outputDeclarations.isEmpty()) {
            outputDeclarations.append("# No outputs defined\n");
        }
        if (resources.isEmpty()) {
            resources.append("# No resources generated\n");
        }

        files.put("main.tf", resources.toString().stripTrailing() + "\n");
        files.put("variables.tf", variableDeclarations.toString().stripTrailing() + "\n");
        files.put("outputs.tf", outputDeclarations.toString().stripTrailing() + "\n");
        files.put("providers.tf", providersContent);
        files.put("versions.tf", versionsContent);

        return new GeneratedCode(
            design.id(),
            providerName,
            Collections.unmodifiableMap(files),
            resourceCount,
            System.currentTimeMillis()
        );
    }

    private String resolveTemplate(String resourceType, String nodeProvider) {
        Optional<TerraformTemplate> dbTemplate = templateRepository.findByResourceType(resourceType);
        if (dbTemplate.isPresent() && dbTemplate.get().isActive()) {
            return dbTemplate.get().getTemplateContent();
        }
        BuiltInTemplate bt = builtInTemplates.get(resourceType);
        if (bt != null) {
            return bt.template();
        }
        BuiltInTemplate fallback = builtInTemplates.entrySet().stream()
            .filter(e -> e.getKey().equalsIgnoreCase(resourceType) ||
                         e.getKey().endsWith("/" + resourceType))
            .map(Map.Entry::getValue)
            .findFirst()
            .orElse(null);
        if (fallback != null) {
            return fallback.template();
        }
        return null;
    }

    static String renderTemplate(String template, Map<String, String> properties, String nodeId) {
        // Merge node ID into properties for {{id}} replacement
        Map<String, String> merged = new LinkedHashMap<>(properties);
        merged.putIfAbsent("id", nodeId != null ? nodeId : "");
        
        StringBuffer result = new StringBuffer();
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        while (matcher.find()) {
            String varName = matcher.group(1);
            String replacement = merged.getOrDefault(varName, "");
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String generateVariable(VariableDef var) {
        StringBuilder sb = new StringBuilder();
        sb.append("variable \"").append(var.name()).append("\" {\n");
        sb.append("  type        = ").append(var.type()).append("\n");
        if (var.description() != null && !var.description().isBlank()) {
            sb.append("  description = \"").append(var.description()).append("\"\n");
        }
        if (var.defaultValue() != null && !var.defaultValue().isBlank()) {
            sb.append("  default     = \"").append(var.defaultValue()).append("\"\n");
        }
        sb.append("}\n\n");
        return sb.toString();
    }

    private String generateOutput(OutputDef out, String nodeId) {
        String value = out.valueTemplate()
            .replace("{{id}}", nodeId)
            .replace("{{name}}", nodeId);
        StringBuilder sb = new StringBuilder();
        sb.append("output \"").append(out.name()).append("\" {\n");
        if (out.description() != null && !out.description().isBlank()) {
            sb.append("  description = \"").append(out.description()).append("\"\n");
        }
        sb.append("  value       = ").append(value).append("\n");
        sb.append("}\n\n");
        return sb.toString();
    }

    private String generateProviders(String provider) {
        return switch (provider) {
            case "aws" -> """
provider "aws" {
  region = var.aws_region
}
""";
            case "azurerm" -> """
provider "azurerm" {
  features {}
}
""";
            case "google" -> """
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
""";
            default -> """
provider "%s" {
}
""".formatted(provider);
        };
    }

    private String generateVersions(String engine) {
        return generateVersionsForProvider(engine, null);
    }

    private String generateVersionsForProvider(String engine, String provider) {
        boolean isOpenTofu = "opentofu".equalsIgnoreCase(engine);
        String requiredVersion = ">= 1.6.0";

        StringBuilder sb = new StringBuilder();
        sb.append("terraform {\n");
        sb.append("  required_version = \"").append(requiredVersion).append("\"\n");
        sb.append("  required_providers {\n");

        if (provider == null || provider.equals("aws") || provider.startsWith("aws_")) {
            String src = isOpenTofu ? "opentofu/aws" : "hashicorp/aws";
            sb.append("    aws = {\n");
            sb.append("      source  = \"").append(src).append("\"\n");
            sb.append("      version = \"~> 5.0\"\n");
            sb.append("    }\n");
        }
        if (provider == null || provider.equals("azurerm") || provider.startsWith("azurerm_")) {
            String src = isOpenTofu ? "opentofu/azurerm" : "hashicorp/azurerm";
            sb.append("    azurerm = {\n");
            sb.append("      source  = \"").append(src).append("\"\n");
            sb.append("      version = \"~> 3.0\"\n");
            sb.append("    }\n");
        }
        if (provider == null || provider.equals("google") || provider.startsWith("google_")) {
            String src = isOpenTofu ? "opentofu/google" : "hashicorp/google";
            sb.append("    google = {\n");
            sb.append("      source  = \"").append(src).append("\"\n");
            sb.append("      version = \"~> 5.0\"\n");
            sb.append("    }\n");
        }
        sb.append("  }\n}\n");
        return sb.toString();
    }

    private void initBuiltInTemplates() {
        builtInTemplates.put("aws_vpc", new BuiltInTemplate(
            """
resource "aws_vpc" "{{id}}" {
  cidr_block           = "{{cidr_block}}"
  enable_dns_hostnames = {{enable_dns_hostnames}}
  enable_dns_support   = {{enable_dns_support}}
  instance_tenancy     = "{{instance_tenancy}}"
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("aws_region", "string", "AWS region", "us-east-1"),
                new VariableDef("vpc_cidr", "string", "VPC CIDR block", "10.0.0.0/16")
            ),
            List.of(
                new OutputDef("vpc_id", "The VPC ID", "aws_vpc.{{id}}.id"),
                new OutputDef("vpc_arn", "The VPC ARN", "aws_vpc.{{id}}.arn")
            )
        ));

        builtInTemplates.put("aws_subnet", new BuiltInTemplate(
            """
resource "aws_subnet" "{{id}}" {
  vpc_id                  = aws_vpc.{{vpc_id}}.id
  cidr_block              = "{{cidr_block}}"
  availability_zone       = "{{availability_zone}}"
  map_public_ip_on_launch = {{map_public_ip_on_launch}}
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("subnet_cidr", "string", "Subnet CIDR block", "10.0.1.0/24"),
                new VariableDef("availability_zone", "string", "Availability zone", "us-east-1a")
            ),
            List.of(
                new OutputDef("subnet_id", "The Subnet ID", "aws_subnet.{{id}}.id"),
                new OutputDef("subnet_arn", "The Subnet ARN", "aws_subnet.{{id}}.arn")
            )
        ));

        builtInTemplates.put("aws_instance", new BuiltInTemplate(
            """
resource "aws_instance" "{{id}}" {
  ami                    = "{{ami}}"
  instance_type          = "{{instance_type}}"
  subnet_id              = aws_subnet.{{subnet_id}}.id
  key_name               = "{{key_name}}"
  vpc_security_group_ids = [aws_security_group.{{security_group_id}}.id]
  associate_public_ip_address = {{associate_public_ip_address}}
  root_block_device {
    volume_size = {{root_volume_size}}
    volume_type = "{{root_volume_type}}"
  }
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("instance_ami", "string", "EC2 AMI ID", "ami-0c55b159cbfafe1f0"),
                new VariableDef("instance_type", "string", "EC2 instance type", "t3.micro")
            ),
            List.of(
                new OutputDef("instance_id", "The Instance ID", "aws_instance.{{id}}.id"),
                new OutputDef("public_ip", "The public IP address", "aws_instance.{{id}}.public_ip"),
                new OutputDef("private_ip", "The private IP address", "aws_instance.{{id}}.private_ip")
            )
        ));

        builtInTemplates.put("aws_db_instance", new BuiltInTemplate(
            """
resource "aws_db_instance" "{{id}}" {
  identifier             = "{{identifier}}"
  engine                 = "{{engine}}"
  engine_version         = "{{engine_version}}"
  instance_class         = "{{instance_class}}"
  allocated_storage      = {{allocated_storage}}
  storage_type           = "{{storage_type}}"
  db_name                = "{{db_name}}"
  username               = "{{username}}"
  password               = "{{password}}"
  db_subnet_group_name   = aws_db_subnet_group.{{subnet_group_id}}.name
  vpc_security_group_ids = [aws_security_group.{{security_group_id}}.id]
  skip_final_snapshot    = {{skip_final_snapshot}}
  publicly_accessible    = {{publicly_accessible}}
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("db_engine", "string", "Database engine", "postgres"),
                new VariableDef("db_instance_class", "string", "DB instance class", "db.t3.micro"),
                new VariableDef("db_username", "string", "Database master username", "admin"),
                new VariableDef("db_password", "string", "Database master password", "changeme123")
            ),
            List.of(
                new OutputDef("db_endpoint", "The database endpoint", "aws_db_instance.{{id}}.endpoint"),
                new OutputDef("db_address", "The database address", "aws_db_instance.{{id}}.address"),
                new OutputDef("db_port", "The database port", "aws_db_instance.{{id}}.port")
            )
        ));

        builtInTemplates.put("aws_lb", new BuiltInTemplate(
            """
resource "aws_lb" "{{id}}" {
  name               = "{{name}}"
  internal           = {{internal}}
  load_balancer_type = "{{load_balancer_type}}"
  security_groups    = [aws_security_group.{{security_group_id}}.id]
  subnets            = [aws_subnet.{{subnet_id}}.id]
  enable_deletion_protection = {{enable_deletion_protection}}
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("lb_type", "string", "Load balancer type", "application"),
                new VariableDef("lb_internal", "bool", "Internal load balancer", "false")
            ),
            List.of(
                new OutputDef("lb_dns_name", "The DNS name of the LB", "aws_lb.{{id}}.dns_name"),
                new OutputDef("lb_zone_id", "The zone ID of the LB", "aws_lb.{{id}}.zone_id"),
                new OutputDef("lb_arn", "The ARN of the LB", "aws_lb.{{id}}.arn")
            )
        ));

        builtInTemplates.put("aws_s3_bucket", new BuiltInTemplate(
            """
resource "aws_s3_bucket" "{{id}}" {
  bucket = "{{bucket_name}}"
  force_destroy = {{force_destroy}}
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}

resource "aws_s3_bucket_versioning" "{{id}}_versioning" {
  bucket = aws_s3_bucket.{{id}}.id
  versioning_configuration {
    status = "{{versioning_status}}"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "{{id}}_encryption" {
  bucket = aws_s3_bucket.{{id}}.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
""",
            List.of(
                new VariableDef("bucket_name", "string", "S3 bucket name", "my-bucket"),
                new VariableDef("s3_acl", "string", "S3 bucket ACL", "private")
            ),
            List.of(
                new OutputDef("bucket_id", "The S3 bucket ID", "aws_s3_bucket.{{id}}.id"),
                new OutputDef("bucket_arn", "The S3 bucket ARN", "aws_s3_bucket.{{id}}.arn"),
                new OutputDef("bucket_domain", "The S3 bucket domain", "aws_s3_bucket.{{id}}.bucket_domain_name")
            )
        ));

        builtInTemplates.put("aws_security_group", new BuiltInTemplate(
            """
resource "aws_security_group" "{{id}}" {
  name        = "{{name}}"
  description = "{{description}}"
  vpc_id      = aws_vpc.{{vpc_id}}.id
  ingress {
    from_port   = {{ingress_from_port}}
    to_port     = {{ingress_to_port}}
    protocol    = "{{ingress_protocol}}"
    cidr_blocks = ["{{ingress_cidr_blocks}}"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("sg_name", "string", "Security group name", "my-security-group"),
                new VariableDef("sg_description", "string", "Security group description", "Managed by CloudBuilder")
            ),
            List.of(
                new OutputDef("sg_id", "The Security Group ID", "aws_security_group.{{id}}.id"),
                new OutputDef("sg_arn", "The Security Group ARN", "aws_security_group.{{id}}.arn")
            )
        ));

        builtInTemplates.put("aws_lambda_function", new BuiltInTemplate(
            """
resource "aws_lambda_function" "{{id}}" {
  filename         = "{{filename}}"
  function_name    = "{{function_name}}"
  role             = aws_iam_role.{{role_id}}.arn
  handler          = "{{handler}}"
  runtime          = "{{runtime}}"
  memory_size      = {{memory_size}}
  timeout          = {{timeout}}
  source_code_hash = filebase64sha256("{{filename}}")
  environment {
    variables = {
      {{environment_variables}}
    }
  }
  tags = {
    Name        = "{{name}}"
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("lambda_runtime", "string", "Lambda runtime", "nodejs18.x"),
                new VariableDef("lambda_handler", "string", "Lambda handler", "index.handler"),
                new VariableDef("lambda_role", "string", "IAM role ARN for Lambda", "")
            ),
            List.of(
                new OutputDef("lambda_arn", "The Lambda ARN", "aws_lambda_function.{{id}}.arn"),
                new OutputDef("lambda_invoke_arn", "The Lambda invoke ARN", "aws_lambda_function.{{id}}.invoke_arn"),
                new OutputDef("lambda_name", "The Lambda function name", "aws_lambda_function.{{id}}.function_name")
            )
        ));

        builtInTemplates.put("azurerm_virtual_network", new BuiltInTemplate(
            """
resource "azurerm_virtual_network" "{{id}}" {
  name                = "{{name}}"
  resource_group_name = azurerm_resource_group.{{resource_group_id}}.name
  location            = azurerm_resource_group.{{resource_group_id}}.location
  address_space       = ["{{address_space}}"]
  tags = {
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("azure_location", "string", "Azure region", "eastus"),
                new VariableDef("azure_resource_group", "string", "Azure resource group name", "my-resource-group")
            ),
            List.of(
                new OutputDef("vnet_id", "The virtual network ID", "azurerm_virtual_network.{{id}}.id"),
                new OutputDef("vnet_name", "The virtual network name", "azurerm_virtual_network.{{id}}.name"),
                new OutputDef("vnet_location", "The virtual network location", "azurerm_virtual_network.{{id}}.location")
            )
        ));

        builtInTemplates.put("azurerm_virtual_machine", new BuiltInTemplate(
            """
resource "azurerm_virtual_machine" "{{id}}" {
  name                  = "{{name}}"
  location              = azurerm_resource_group.{{resource_group_id}}.location
  resource_group_name   = azurerm_resource_group.{{resource_group_id}}.name
  network_interface_ids = [azurerm_network_interface.{{network_interface_id}}.id]
  vm_size               = "{{vm_size}}"
  storage_image_reference {
    publisher = "{{image_publisher}}"
    offer     = "{{image_offer}}"
    sku       = "{{image_sku}}"
    version   = "latest"
  }
  storage_os_disk {
    name              = "{{name}}-osdisk"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "{{managed_disk_type}}"
  }
  os_profile {
    computer_name  = "{{name}}"
    admin_username = "{{admin_username}}"
    admin_password = "{{admin_password}}"
  }
  tags = {
    Environment = "{{environment}}"
  }
}
""",
            List.of(
                new VariableDef("vm_size", "string", "Azure VM size", "Standard_DS1_v2"),
                new VariableDef("admin_username", "string", "Admin username", "azureuser"),
                new VariableDef("admin_password", "string", "Admin password", "Password123!")
            ),
            List.of(
                new OutputDef("vm_id", "The virtual machine ID", "azurerm_virtual_machine.{{id}}.id"),
                new OutputDef("vm_private_ip", "The private IP address", "azurerm_virtual_machine.{{id}}.private_ip_address"),
                new OutputDef("vm_public_ip", "The public IP address", "azurerm_virtual_machine.{{id}}.public_ip_address")
            )
        ));

        builtInTemplates.put("google_compute_network", new BuiltInTemplate(
            """
resource "google_compute_network" "{{id}}" {
  name                    = "{{name}}"
  auto_create_subnetworks = {{auto_create_subnetworks}}
  routing_mode            = "{{routing_mode}}"
  project                 = var.gcp_project_id
}
""",
            List.of(
                new VariableDef("gcp_project_id", "string", "GCP project ID", "my-project"),
                new VariableDef("gcp_region", "string", "GCP region", "us-central1")
            ),
            List.of(
                new OutputDef("network_id", "The network ID", "google_compute_network.{{id}}.id"),
                new OutputDef("network_name", "The network name", "google_compute_network.{{id}}.name"),
                new OutputDef("network_gateway", "The network gateway", "google_compute_network.{{id}}.gateway_ipv4")
            )
        ));

        builtInTemplates.put("google_compute_subnetwork", new BuiltInTemplate(
            """
resource "google_compute_subnetwork" "{{id}}" {
  name          = "{{name}}"
  network       = "{{network}}"
  ip_cidr_range = "{{ipCidrRange}}"
  region        = "{{region}}"
  project       = var.gcp_project_id
}
""",
            List.of(
                // Reuse gcp_project_id and gcp_region from google_compute_network
            ),
            List.of(
                new OutputDef("subnet_id", "The subnet ID", "google_compute_subnetwork.{{id}}.id"),
                new OutputDef("subnet_name", "The subnet name", "google_compute_subnetwork.{{id}}.name"),
                new OutputDef("subnet_self_link", "The subnet self link", "google_compute_subnetwork.{{id}}.self_link")
            )
        ));

        builtInTemplates.put("google_compute_instance", new BuiltInTemplate(
            """
resource "google_compute_instance" "{{id}}" {
  name         = "{{name}}"
  machine_type = "{{machineType}}"
  zone         = "{{zone}}"
  project      = var.gcp_project_id
  boot_disk {
    initialize_params {
      image = "projects/${var.gcp_project_id}/global/images/family/${{{imageProject}}}-{{imageFamily}}"
    }
  }
  network_interface {
    subnetwork = "{{subnetwork}}"
    access_config {
    }
  }
  tags = ["{{name}}"]
}
""",
            List.of(
                // Reuse gcp_project_id from google_compute_network
            ),
            List.of(
                new OutputDef("instance_id", "The instance ID", "google_compute_instance.{{id}}.id"),
                new OutputDef("instance_self_link", "The instance self link", "google_compute_instance.{{id}}.self_link"),
                new OutputDef("instance_nat_ip", "The instance NAT IP", "google_compute_instance.{{id}}.network_interface[0].access_config[0].nat_ip")
            )
        ));

        builtInTemplates.put("google_sql_database_instance", new BuiltInTemplate(
            """
resource "google_sql_database_instance" "{{id}}" {
  name             = "{{name}}"
  database_version = "{{databaseVersion}}"
  region           = "{{region}}"
  project          = var.gcp_project_id

  settings {
    tier = "{{tier}}"
  }

  deletion_protection = false
}
""",
            List.of(
                // Reuse gcp_project_id and gcp_region from google_compute_network
            ),
            List.of(
                new OutputDef("sql_instance_id", "The Cloud SQL instance ID", "google_sql_database_instance.{{id}}.id"),
                new OutputDef("sql_instance_name", "The Cloud SQL instance name", "google_sql_database_instance.{{id}}.name"),
                new OutputDef("sql_connection_name", "The connection name", "google_sql_database_instance.{{id}}.connection_name")
            )
        ));
    }

    private record BuiltInTemplate(String template, List<VariableDef> variables, List<OutputDef> outputs) {}

    private record VariableDef(String name, String type, String description, String defaultValue) {}

    private record OutputDef(String name, String description, String valueTemplate) {}
}
