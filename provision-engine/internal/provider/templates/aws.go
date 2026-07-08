package templates

import (
	"fmt"
	"strings"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// ResourceTemplate generates HCL Terraform code for a given resource node.
type ResourceTemplate func(node model.DesignNode) (string, error)

// ─── AWS VPC ───────────────────────────────────────────────────────────────

func awsVpcTemplate(node model.DesignNode) (string, error) {
	cidr := getStringProp(node.Properties, "cidr_block", "10.0.0.0/16")
	name := getStringProp(node.Properties, "name", node.Name)
	dnsSupport := getBoolProp(node.Properties, "enable_dns_support", true)
	dnsHostnames := getBoolProp(node.Properties, "enable_dns_hostnames", true)
	tenancy := getStringProp(node.Properties, "instance_tenancy", "default")

	return fmt.Sprintf(`resource "aws_vpc" "%s" {
  cidr_block           = "%s"
  enable_dns_hostnames = %v
  enable_dns_support   = %v
  instance_tenancy     = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, cidr, dnsHostnames, dnsSupport, tenancy, name), nil
}

// ─── AWS Subnet ────────────────────────────────────────────────────────────

func awsSubnetTemplate(node model.DesignNode) (string, error) {
	cidr := getStringProp(node.Properties, "cidr_block", "10.0.1.0/24")
	az := getStringProp(node.Properties, "availability_zone", "${data.aws_availability_zones.available.names[0]}")
	name := getStringProp(node.Properties, "name", node.Name)
	publicIP := getBoolProp(node.Properties, "map_public_ip_on_launch", false)

	return fmt.Sprintf(`resource "aws_subnet" "%s" {
  vpc_id                  = aws_vpc.%s.id
  cidr_block              = "%s"
  availability_zone       = "%s"
  map_public_ip_on_launch = %v

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, getParentID(node, "vpc_id", "vpc", "aws_vpc"), cidr, az, publicIP, name), nil
}

// ─── AWS Security Group ────────────────────────────────────────────────────

func awsSecurityGroupTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	desc := getStringProp(node.Properties, "description", "Managed by CloudBuilder")
	ingressFrom := getIntProp(node.Properties, "ingress_from_port", 0)
	ingressTo := getIntProp(node.Properties, "ingress_to_port", 0)
	ingressProto := getStringProp(node.Properties, "ingress_protocol", "-1")
	ingressCIDR := getStringProp(node.Properties, "ingress_cidr_blocks", "10.0.0.0/8")

	return fmt.Sprintf(`resource "aws_security_group" "%s" {
  name        = "%s"
  description = "%s"
  vpc_id      = aws_vpc.%s.id

  ingress {
    from_port   = %d
    to_port     = %d
    protocol    = "%s"
    cidr_blocks = ["%s"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, desc, getParentID(node, "vpc_id", "vpc", "aws_vpc"),
		ingressFrom, ingressTo, ingressProto, ingressCIDR, name), nil
}

// ─── AWS EC2 Instance ──────────────────────────────────────────────────────

func awsInstanceTemplate(node model.DesignNode) (string, error) {
	ami := getStringProp(node.Properties, "ami", "ami-0c55b159cbfafe1f0")
	instanceType := getStringProp(node.Properties, "instance_type", "t3.micro")
	name := getStringProp(node.Properties, "name", node.Name)
	keyName := getStringProp(node.Properties, "key_name", "")
	publicIP := getBoolProp(node.Properties, "associate_public_ip_address", false)
	ebsOptimized := getBoolProp(node.Properties, "ebs_optimized", false)
	monitoring := getBoolProp(node.Properties, "monitoring", false)
	volSize := getIntProp(node.Properties, "root_volume_size", 30)
	volType := getStringProp(node.Properties, "root_volume_type", "gp3")

	keyNameLine := ""
	if keyName != "" {
		keyNameLine = fmt.Sprintf("\n  key_name = \"%s\"", keyName)
	}

	monitoringStr := ""
	if monitoring {
		monitoringStr = "\n  monitoring = true"
	}

	return fmt.Sprintf(`resource "aws_instance" "%s" {
  ami                    = "%s"
  instance_type          = "%s"
  subnet_id              = aws_subnet.%s.id
  vpc_security_group_ids = [aws_security_group.%s.id]
  associate_public_ip_address = %v
  ebs_optimized          = %v%s%s

  root_block_device {
    volume_type = "%s"
    volume_size = %d
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, ami, instanceType,
		getParentID(node, "subnet_id", "subnet", "aws_subnet"),
		getParentID(node, "security_group_id", "security_group", "aws_security_group"),
		publicIP, ebsOptimized, keyNameLine, monitoringStr,
		volType, volSize, name), nil
}

// ─── AWS S3 Bucket ─────────────────────────────────────────────────────────

func awsS3BucketTemplate(node model.DesignNode) (string, error) {
	bucketName := getStringProp(node.Properties, "bucket", fmt.Sprintf("%s-bucket", strings.ToLower(node.Name)))
	versioning := getBoolProp(node.Properties, "versioning", true)
	forceDestroy := getBoolProp(node.Properties, "force_destroy", false)
	acl := getStringProp(node.Properties, "acl", "private")

	versioningStr := "Disabled"
	if versioning {
		versioningStr = "Enabled"
	}

	return fmt.Sprintf(`resource "aws_s3_bucket" "%s" {
  bucket        = "%s"
  force_destroy = %v
  acl           = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}

resource "aws_s3_bucket_versioning" "%s_versioning" {
  bucket = aws_s3_bucket.%s.id
  versioning_configuration {
    status = "%s"
  }
}`, node.ID, bucketName, forceDestroy, acl, bucketName, node.ID, node.ID, versioningStr), nil
}

// ─── AWS RDS Instance ──────────────────────────────────────────────────────

func awsDbInstanceTemplate(node model.DesignNode) (string, error) {
	identifier := getStringProp(node.Properties, "identifier", strings.ToLower(node.Name))
	engine := getStringProp(node.Properties, "engine", "postgres")
	engineVersion := getStringProp(node.Properties, "engine_version", "16")
	instanceClass := getStringProp(node.Properties, "instance_class", "db.t3.micro")
	storage := getIntProp(node.Properties, "allocated_storage", 20)
	storageType := getStringProp(node.Properties, "storage_type", "gp3")
	dbName := getStringProp(node.Properties, "db_name", "app")
	username := getStringProp(node.Properties, "username", "admin")
	password := getStringProp(node.Properties, "password", "changeme123!")
	skipFinalSnapshot := getBoolProp(node.Properties, "skip_final_snapshot", true)
	publiclyAccessible := getBoolProp(node.Properties, "publicly_accessible", false)

	return fmt.Sprintf(`resource "aws_db_instance" "%s" {
  identifier           = "%s"
  engine               = "%s"
  engine_version       = "%s"
  instance_class       = "%s"
  allocated_storage    = %d
  storage_type         = "%s"
  db_name              = "%s"
  username             = "%s"
  password             = "%s"
  skip_final_snapshot  = %v
  publicly_accessible  = %v
  multi_az             = false

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, identifier, engine, engineVersion, instanceClass,
		storage, storageType, dbName, username, password,
		skipFinalSnapshot, publiclyAccessible, identifier), nil
}

// ─── AWS ALB/NLB ───────────────────────────────────────────────────────────

func awsLbTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	internal := getBoolProp(node.Properties, "internal", false)
	lbType := getStringProp(node.Properties, "load_balancer_type", "application")
	deletionProtection := getBoolProp(node.Properties, "enable_deletion_protection", false)

	return fmt.Sprintf(`resource "aws_lb" "%s" {
  name               = "%s"
  internal           = %v
  load_balancer_type = "%s"
  security_groups    = [aws_security_group.%s.id]
  subnets            = [aws_subnet.%s.id]

  enable_deletion_protection = %v

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, internal, lbType,
		getParentID(node, "security_group_id", "security_group", "aws_security_group"),
		getParentID(node, "subnet_id", "subnet", "aws_subnet"),
		deletionProtection, name), nil
}

// ─── AWS Lambda ────────────────────────────────────────────────────────────

func awsLambdaFunctionTemplate(node model.DesignNode) (string, error) {
	funcName := getStringProp(node.Properties, "function_name", strings.ToLower(node.Name))
	runtime := getStringProp(node.Properties, "runtime", "nodejs20.x")
	handler := getStringProp(node.Properties, "handler", "index.handler")
	memorySize := getIntProp(node.Properties, "memory_size", 128)
	timeout := getIntProp(node.Properties, "timeout", 30)

	return fmt.Sprintf(`resource "aws_lambda_function" "%s" {
  function_name = "%s"
  runtime       = "%s"
  handler       = "%s"
  memory_size   = %d
  timeout       = %d
  filename      = "lambda.zip"

  role = aws_iam_role.%s.arn

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, funcName, runtime, handler, memorySize, timeout,
		getParentID(node, "role_id", "lambda_role", "aws_iam_role"), funcName), nil
}

// ─── AWS ECS Cluster ───────────────────────────────────────────────────────

func awsEcsClusterTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "aws_ecs_cluster" "%s" {
  name = "%s"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, name), nil
}

// ─── AWS ElastiCache ───────────────────────────────────────────────────────

func awsElastiCacheClusterTemplate(node model.DesignNode) (string, error) {
	clusterID := getStringProp(node.Properties, "cluster_id", strings.ToLower(node.Name))
	engine := getStringProp(node.Properties, "engine", "redis")
	nodeType := getStringProp(node.Properties, "node_type", "cache.t3.micro")
	numNodes := getIntProp(node.Properties, "num_cache_nodes", 1)

	return fmt.Sprintf(`resource "aws_elasticache_cluster" "%s" {
  cluster_id           = "%s"
  engine               = "%s"
  node_type            = "%s"
  num_cache_nodes      = %d
  parameter_group_name = "default.redis7"
  port                 = 6379

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, clusterID, engine, nodeType, numNodes, clusterID), nil
}

// ─── AWS DynamoDB ──────────────────────────────────────────────────────────

func awsDynamodbTableTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	billingMode := getStringProp(node.Properties, "billing_mode", "PAY_PER_REQUEST")
	hashKey := getStringProp(node.Properties, "hash_key", "id")

	return fmt.Sprintf(`resource "aws_dynamodb_table" "%s" {
  name         = "%s"
  billing_mode = "%s"
  hash_key     = "%s"

  attribute {
    name = "%s"
    type = "S"
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, billingMode, hashKey, hashKey, name), nil
}

// ─── AWS Internet Gateway ──────────────────────────────────────────────────

func awsInternetGatewayTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "aws_internet_gateway" "%s" {
  vpc_id = aws_vpc.%s.id

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, getParentID(node, "vpc_id", "vpc", "aws_vpc"), name), nil
}

// ─── AWS NAT Gateway ───────────────────────────────────────────────────────

func awsNatGatewayTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	connectivityType := getStringProp(node.Properties, "connectivity_type", "public")

	return fmt.Sprintf(`resource "aws_nat_gateway" "%s" {
  allocation_id = aws_eip.%s.id
  subnet_id     = aws_subnet.%s.id
  connectivity_type = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }

  depends_on = [aws_internet_gateway.%s]
}`, node.ID, node.ID,
		getParentID(node, "subnet_id", "subnet", "aws_subnet"),
		connectivityType, name,
		getParentID(node, "vpc_id", "vpc", "aws_vpc")), nil
}

// ─── AWS Route Table ───────────────────────────────────────────────────────

func awsRouteTableTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "aws_route_table" "%s" {
  vpc_id = aws_vpc.%s.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.%s.id
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, getParentID(node, "vpc_id", "vpc", "aws_vpc"),
		getParentID(node, "gateway_id", "internet_gateway", "aws_internet_gateway"), name), nil
}

// ─── AWS Auto Scaling Group ────────────────────────────────────────────────

func awsAutoscalingGroupTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	minSize := getIntProp(node.Properties, "min_size", 1)
	maxSize := getIntProp(node.Properties, "max_size", 4)
	desired := getIntProp(node.Properties, "desired_capacity", 2)

	return fmt.Sprintf(`resource "aws_autoscaling_group" "%s" {
  name                = "%s"
  min_size            = %d
  max_size            = %d
  desired_capacity    = %d
  vpc_zone_identifier = [aws_subnet.%s.id]
  target_group_arns   = [aws_lb_target_group.%s.arn]

  launch_template {
    id      = aws_launch_template.%s.id
    version = "$Latest"
  }

  tags = [{
    key                 = "Name"
    value               = "%s"
    propagate_at_launch = true
  }, {
    key                 = "Environment"
    value               = "${var.environment}"
    propagate_at_launch = true
  }]
}`, node.ID, name, minSize, maxSize, desired,
		getParentID(node, "subnet_id", "subnet", "aws_subnet"),
		getParentID(node, "target_group_id", "lb_target_group", "aws_lb_target_group"),
		getParentID(node, "launch_template_id", "launch_template", "aws_launch_template"),
		name), nil
}

// ─── AWS Launch Template ───────────────────────────────────────────────────

func awsLaunchTemplateTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	imageID := getStringProp(node.Properties, "image_id", "ami-0c55b159cbfafe1f0")
	instanceType := getStringProp(node.Properties, "instance_type", "t3.micro")
	keyName := getStringProp(node.Properties, "key_name", "")

	keyNameLine := ""
	if keyName != "" {
		keyNameLine = fmt.Sprintf("\n    key_name = \"%s\"", keyName)
	}

	return fmt.Sprintf(`resource "aws_launch_template" "%s" {
  name          = "%s"
  image_id      = "%s"
  instance_type = "%s"%s

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "%s"
      Environment = "${var.environment}"
      ManagedBy   = "CloudBuilder"
    }
  }
}`, node.ID, name, imageID, instanceType, keyNameLine, name), nil
}

// ─── AWS EBS Volume ────────────────────────────────────────────────────────

func awsEbsVolumeTemplate(node model.DesignNode) (string, error) {
	az := getStringProp(node.Properties, "availability_zone", "${data.aws_availability_zones.available.names[0]}")
	size := getIntProp(node.Properties, "size", 20)
	volType := getStringProp(node.Properties, "volume_type", "gp3")
	encrypted := getBoolProp(node.Properties, "encrypted", true)

	return fmt.Sprintf(`resource "aws_ebs_volume" "%s" {
  availability_zone = "%s"
  size              = %d
  type              = "%s"
  encrypted         = %v

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, az, size, volType, encrypted, node.Name), nil
}

// ─── AWS EFS ───────────────────────────────────────────────────────────────

func awsEfsFileSystemTemplate(node model.DesignNode) (string, error) {
	performanceMode := getStringProp(node.Properties, "performance_mode", "generalPurpose")
	throughputMode := getStringProp(node.Properties, "throughput_mode", "bursting")
	encrypted := getBoolProp(node.Properties, "encrypted", true)

	return fmt.Sprintf(`resource "aws_efs_file_system" "%s" {
  performance_mode = "%s"
  throughput_mode  = "%s"
  encrypted        = %v

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, performanceMode, throughputMode, encrypted, node.Name), nil
}

// ─── AWS Network ACL ───────────────────────────────────────────────────────

func awsNetworkAclTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "aws_network_acl" "%s" {
  vpc_id = aws_vpc.%s.id

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, getParentID(node, "vpc_id", "vpc", "aws_vpc"), name), nil
}

// ─── AWS ECR Repository ────────────────────────────────────────────────────

func awsEcrRepositoryTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	mutability := getStringProp(node.Properties, "image_tag_mutability", "MUTABLE")
	scanOnPush := getBoolProp(node.Properties, "scan_on_push", true)

	return fmt.Sprintf(`resource "aws_ecr_repository" "%s" {
  name                 = "%s"
  image_tag_mutability = "%s"

  image_scanning_configuration {
    scan_on_push = %v
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, mutability, scanOnPush, name), nil
}

// ─── AWS SQS Queue ─────────────────────────────────────────────────────────

func awsSqsQueueTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", fmt.Sprintf("%s-queue", strings.ToLower(node.Name)))
	delay := getIntProp(node.Properties, "delay_seconds", 0)
	maxSize := getIntProp(node.Properties, "max_message_size", 262144)
	visibilityTimeout := getIntProp(node.Properties, "visibility_timeout_seconds", 30)

	return fmt.Sprintf(`resource "aws_sqs_queue" "%s" {
  name                       = "%s"
  delay_seconds              = %d
  max_message_size           = %d
  visibility_timeout_seconds = %d

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, delay, maxSize, visibilityTimeout, name), nil
}

// ─── AWS SNS Topic ─────────────────────────────────────────────────────────

func awsSnsTopicTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", fmt.Sprintf("%s-topic", strings.ToLower(node.Name)))
	displayName := getStringProp(node.Properties, "display_name", name)
	fifo := getBoolProp(node.Properties, "fifo_topic", false)

	nameSuffix := ""
	if fifo {
		nameSuffix = ".fifo"
	}

	return fmt.Sprintf(`resource "aws_sns_topic" "%s" {
  name         = "%s%s"
  display_name = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, nameSuffix, displayName, name), nil
}

// ─── AWS CloudWatch Alarm ──────────────────────────────────────────────────

func awsCloudwatchAlarmTemplate(node model.DesignNode) (string, error) {
	alarmName := getStringProp(node.Properties, "alarm_name", node.Name)
	metricName := getStringProp(node.Properties, "metric_name", "CPUUtilization")
	comparisonOp := getStringProp(node.Properties, "comparison_operator", "GreaterThanThreshold")
	evaluationPeriods := getIntProp(node.Properties, "evaluation_periods", 2)
	threshold := getStringProp(node.Properties, "threshold", "80")
	description := getStringProp(node.Properties, "alarm_description", "CloudBuilder managed alarm")

	return fmt.Sprintf(`resource "aws_cloudwatch_metric_alarm" "%s" {
  alarm_name          = "%s"
  metric_name         = "%s"
  comparison_operator = "%s"
  evaluation_periods  = %d
  threshold           = "%s"
  alarm_description   = "%s"
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, alarmName, metricName, comparisonOp,
		evaluationPeriods, threshold, description, alarmName), nil
}

// ─── AWS CloudFront Distribution ───────────────────────────────────────────

func awsCloudfrontDistributionTemplate(node model.DesignNode) (string, error) {
	originDomain := getStringProp(node.Properties, "origin_domain_name", "${aws_s3_bucket.%s.bucket_regional_domain_name}")
	enabled := getBoolProp(node.Properties, "enabled", true)
	priceClass := getStringProp(node.Properties, "price_class", "PriceClass_100")
	comment := getStringProp(node.Properties, "comment", node.Name)

	return fmt.Sprintf(`resource "aws_cloudfront_distribution" "%s" {
  enabled         = %v
  comment         = "%s"
  price_class     = "%s"
  is_ipv6_enabled = true

  origin {
    domain_name = %s
    origin_id   = "s3-origin"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, enabled, comment, priceClass, originDomain, comment), nil
}

// ─── Template Registry ─────────────────────────────────────────────────────

func awsTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		// Core networking
		"aws_vpc":                  awsVpcTemplate,
		"aws_subnet":               awsSubnetTemplate,
		"aws_security_group":       awsSecurityGroupTemplate,
		"aws_internet_gateway":     awsInternetGatewayTemplate,
		"aws_nat_gateway":          awsNatGatewayTemplate,
		"aws_route_table":          awsRouteTableTemplate,
		"aws_network_acl":          awsNetworkAclTemplate,
		// Compute
		"aws_instance":             awsInstanceTemplate,
		"aws_launch_template":      awsLaunchTemplateTemplate,
		"aws_autoscaling_group":    awsAutoscalingGroupTemplate,
		// Storage
		"aws_s3_bucket":            awsS3BucketTemplate,
		"aws_ebs_volume":           awsEbsVolumeTemplate,
		"aws_efs_file_system":      awsEfsFileSystemTemplate,
		// Database
		"aws_db_instance":          awsDbInstanceTemplate,
		"aws_dynamodb_table":       awsDynamodbTableTemplate,
		// Cache
		"aws_elasticache_cluster":  awsElastiCacheClusterTemplate,
		// Load balancing
		"aws_lb":                   awsLbTemplate,
		// Serverless
		"aws_lambda_function":      awsLambdaFunctionTemplate,
		// Containers
		"aws_ecs_cluster":          awsEcsClusterTemplate,
		"aws_ecr_repository":       awsEcrRepositoryTemplate,
		// Messaging
		"aws_sqs_queue":            awsSqsQueueTemplate,
		"aws_sns_topic":            awsSnsTopicTemplate,
		// Monitoring
		"aws_cloudwatch_metric_alarm": awsCloudwatchAlarmTemplate,
		// CDN
		"aws_cloudfront_distribution": awsCloudfrontDistributionTemplate,
		// Aliases (short names)
		"vpc":             awsVpcTemplate,
		"subnet":          awsSubnetTemplate,
		"security_group":  awsSecurityGroupTemplate,
		"igw":             awsInternetGatewayTemplate,
		"nat":             awsNatGatewayTemplate,
		"rtb":             awsRouteTableTemplate,
		"nacl":            awsNetworkAclTemplate,
		"instance":        awsInstanceTemplate,
		"ec2":             awsInstanceTemplate,
		"lt":              awsLaunchTemplateTemplate,
		"asg":             awsAutoscalingGroupTemplate,
		"s3":              awsS3BucketTemplate,
		"s3_bucket":       awsS3BucketTemplate,
		"ebs":             awsEbsVolumeTemplate,
		"efs":             awsEfsFileSystemTemplate,
		"rds":             awsDbInstanceTemplate,
		"dynamodb":        awsDynamodbTableTemplate,
		"elasticache":     awsElastiCacheClusterTemplate,
		"alb":             awsLbTemplate,
		"nlb":             awsLbTemplate,
		"lambda":          awsLambdaFunctionTemplate,
		"ecs":             awsEcsClusterTemplate,
		"ecr":             awsEcrRepositoryTemplate,
		"sqs":             awsSqsQueueTemplate,
		"sns":             awsSnsTopicTemplate,
		"cloudwatch":      awsCloudwatchAlarmTemplate,
		"cloudfront":      awsCloudfrontDistributionTemplate,
	}
}

// ─── Helpers ───────────────────────────────────────────────────────────────

func getStringProp(props map[string]interface{}, key, defaultVal string) string {
	if props == nil {
		return defaultVal
	}
	if v, ok := props[key]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return defaultVal
}

func getIntProp(props map[string]interface{}, key string, defaultVal int) int {
	if props == nil {
		return defaultVal
	}
	if v, ok := props[key]; ok {
		switch n := v.(type) {
		case int:
			return n
		case float64:
			return int(n)
		case string:
			if n == "" {
				return defaultVal
			}
			var i int
			if _, err := fmt.Sscanf(n, "%d", &i); err == nil {
				return i
			}
		}
	}
	return defaultVal
}

func getBoolProp(props map[string]interface{}, key string, defaultVal bool) bool {
	if props == nil {
		return defaultVal
	}
	if v, ok := props[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return defaultVal
}

// getParentID resolves a parent resource reference from properties.
// Tries snake_case key first, then camelCase fallback, then alias prefix.
func getParentID(node model.DesignNode, propertyKey string, aliasPrefix string, tfType string) string {
	// Direct property reference (snake_case)
	if v, ok := node.Properties[propertyKey]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	// CamelCase fallback (e.g., "vpc_id" → "vpcId")
	camelKey := snakeToCamel(propertyKey)
	if v, ok := node.Properties[camelKey]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	// Alias-based lookup
	if v, ok := node.Properties[aliasPrefix]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

// snakeToCamel converts "vpc_id" to "vpcId".
func snakeToCamel(s string) string {
	parts := strings.Split(s, "_")
	for i := 1; i < len(parts); i++ {
		parts[i] = strings.Title(parts[i])
	}
	return strings.Join(parts, "")
}
