export interface PropertyOption {
  label: string
  value: string
}

export interface PropertyField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'tags' | 'cidr'
  required: boolean
  description: string
  placeholder?: string
  defaultValue?: any
  options?: PropertyOption[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

const schemas: Record<string, PropertyField[]> = {
  aws_vpc: [
    {
      key: 'cidr_block',
      label: 'CIDR Block',
      type: 'cidr',
      required: true,
      description: 'The CIDR block for the VPC',
      placeholder: '10.0.0.0/16',
      validation: { pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$', message: 'Invalid CIDR notation' },
    },
    {
      key: 'enable_dns_support',
      label: 'DNS Support',
      type: 'boolean',
      required: false,
      description: 'Enable DNS support in the VPC',
      defaultValue: true,
    },
    {
      key: 'enable_dns_hostnames',
      label: 'DNS Hostnames',
      type: 'boolean',
      required: false,
      description: 'Enable DNS hostnames in the VPC',
      defaultValue: false,
    },
    {
      key: 'instance_tenancy',
      label: 'Instance Tenancy',
      type: 'select',
      required: false,
      description: 'The tenancy option for instances launched in the VPC',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Dedicated', value: 'dedicated' },
      ],
    },
  ],

  aws_subnet: [
    {
      key: 'vpc_id',
      label: 'VPC ID',
      type: 'text',
      required: true,
      description: 'The ID of the VPC',
    },
    {
      key: 'cidr_block',
      label: 'CIDR Block',
      type: 'cidr',
      required: true,
      description: 'The CIDR block for the subnet',
      placeholder: '10.0.1.0/24',
      validation: { pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$', message: 'Invalid CIDR notation' },
    },
    {
      key: 'availability_zone',
      label: 'Availability Zone',
      type: 'text',
      required: false,
      description: 'The availability zone for the subnet',
      placeholder: 'us-east-1a',
    },
    {
      key: 'map_public_ip_on_launch',
      label: 'Auto-assign Public IP',
      type: 'boolean',
      required: false,
      description: 'Automatically assign public IP on launch',
      defaultValue: false,
    },
  ],

  aws_instance: [
    {
      key: 'ami',
      label: 'AMI',
      type: 'text',
      required: true,
      description: 'The Amazon Machine Image ID',
      placeholder: 'ami-xxxxx',
    },
    {
      key: 'instance_type',
      label: 'Instance Type',
      type: 'select',
      required: false,
      description: 'The EC2 instance type',
      defaultValue: 't3.medium',
      options: [
        { label: 'm5.large', value: 'm5.large' },
        { label: 'm5.xlarge', value: 'm5.xlarge' },
        { label: 'm5.2xlarge', value: 'm5.2xlarge' },
        { label: 't3.medium', value: 't3.medium' },
        { label: 't3.large', value: 't3.large' },
        { label: 't3.xlarge', value: 't3.xlarge' },
      ],
    },
    {
      key: 'key_name',
      label: 'Key Pair',
      type: 'text',
      required: false,
      description: 'The name of the key pair',
    },
    {
      key: 'monitoring',
      label: 'Monitoring',
      type: 'boolean',
      required: false,
      description: 'Enable detailed monitoring',
      defaultValue: false,
    },
    {
      key: 'ebs_optimized',
      label: 'EBS Optimized',
      type: 'boolean',
      required: false,
      description: 'Enable EBS optimization',
      defaultValue: false,
    },
    {
      key: 'root_block_device_size',
      label: 'Root Disk Size (GB)',
      type: 'number',
      required: false,
      description: 'The size of the root block device in GB',
      defaultValue: 20,
      validation: { min: 8, max: 4096, message: 'Must be between 8 and 4096 GB' },
    },
  ],

  aws_db_instance: [
    {
      key: 'engine',
      label: 'Engine',
      type: 'select',
      required: false,
      description: 'The database engine',
      defaultValue: 'postgres',
      options: [
        { label: 'MySQL', value: 'mysql' },
        { label: 'PostgreSQL', value: 'postgres' },
        { label: 'MariaDB', value: 'mariadb' },
        { label: 'Oracle SE2', value: 'oracle-se2' },
        { label: 'SQL Server Express', value: 'sqlserver-ex' },
      ],
    },
    {
      key: 'engine_version',
      label: 'Engine Version',
      type: 'text',
      required: false,
      description: 'The database engine version',
      placeholder: 'e.g. 16.3',
    },
    {
      key: 'instance_class',
      label: 'Instance Class',
      type: 'select',
      required: false,
      description: 'The DB instance class',
      defaultValue: 'db.t3.micro',
      options: [
        { label: 'db.t3.micro', value: 'db.t3.micro' },
        { label: 'db.t3.small', value: 'db.t3.small' },
        { label: 'db.t3.medium', value: 'db.t3.medium' },
        { label: 'db.r6g.large', value: 'db.r6g.large' },
        { label: 'db.r6g.xlarge', value: 'db.r6g.xlarge' },
      ],
    },
    {
      key: 'allocated_storage',
      label: 'Allocated Storage (GB)',
      type: 'number',
      required: false,
      description: 'The allocated storage size in GB',
      defaultValue: 20,
      validation: { min: 5, max: 65536, message: 'Must be between 5 and 65536 GB' },
    },
    {
      key: 'storage_type',
      label: 'Storage Type',
      type: 'select',
      required: false,
      description: 'The storage type',
      defaultValue: 'gp3',
      options: [
        { label: 'gp2', value: 'gp2' },
        { label: 'gp3', value: 'gp3' },
        { label: 'io1', value: 'io1' },
        { label: 'Standard', value: 'standard' },
      ],
    },
    {
      key: 'db_name',
      label: 'Database Name',
      type: 'text',
      required: false,
      description: 'The name of the database',
    },
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      required: false,
      description: 'The master username',
    },
    {
      key: 'password',
      label: 'Password',
      type: 'text',
      required: false,
      description: 'The master password',
    },
    {
      key: 'skip_final_snapshot',
      label: 'Skip Final Snapshot',
      type: 'boolean',
      required: false,
      description: 'Skip the final snapshot on deletion',
      defaultValue: true,
    },
  ],

  aws_lb: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the load balancer',
    },
    {
      key: 'internal',
      label: 'Internal',
      type: 'boolean',
      required: false,
      description: 'Whether the load balancer is internal',
      defaultValue: false,
    },
    {
      key: 'load_balancer_type',
      label: 'Load Balancer Type',
      type: 'select',
      required: false,
      description: 'The type of load balancer',
      defaultValue: 'application',
      options: [
        { label: 'Application', value: 'application' },
        { label: 'Network', value: 'network' },
      ],
    },
    {
      key: 'enable_deletion_protection',
      label: 'Deletion Protection',
      type: 'boolean',
      required: false,
      description: 'Enable deletion protection',
      defaultValue: false,
    },
  ],

  aws_s3_bucket: [
    {
      key: 'bucket',
      label: 'Bucket Name',
      type: 'text',
      required: true,
      description: 'The name of the S3 bucket',
    },
    {
      key: 'acl',
      label: 'ACL',
      type: 'select',
      required: false,
      description: 'The canned ACL to apply',
      defaultValue: 'private',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Public Read', value: 'public-read' },
        { label: 'Public Read/Write', value: 'public-read-write' },
        { label: 'Authenticated Read', value: 'authenticated-read' },
      ],
    },
    {
      key: 'versioning',
      label: 'Versioning',
      type: 'boolean',
      required: false,
      description: 'Enable bucket versioning',
      defaultValue: false,
    },
    {
      key: 'force_destroy',
      label: 'Force Destroy',
      type: 'boolean',
      required: false,
      description: 'Force destroy the bucket even if not empty',
      defaultValue: false,
    },
  ],

  aws_security_group: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the security group',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      required: false,
      description: 'The description of the security group',
      defaultValue: 'Managed by CloudBuilder',
    },
    {
      key: 'vpc_id',
      label: 'VPC ID',
      type: 'text',
      required: true,
      description: 'The VPC ID',
    },
    {
      key: 'ingress_rules',
      label: 'Ingress Rules',
      type: 'tags',
      required: false,
      description: 'One rule per line (e.g. 0.0.0.0/0:tcp:80)',
    },
    {
      key: 'egress_rules',
      label: 'Egress Rules',
      type: 'tags',
      required: false,
      description: 'One rule per line (e.g. 0.0.0.0/0:tcp:443)',
    },
  ],

  aws_lambda_function: [
    {
      key: 'function_name',
      label: 'Function Name',
      type: 'text',
      required: true,
      description: 'The name of the Lambda function',
    },
    {
      key: 'runtime',
      label: 'Runtime',
      type: 'select',
      required: false,
      description: 'The runtime environment',
      defaultValue: 'nodejs20.x',
      options: [
        { label: 'Node.js 20.x', value: 'nodejs20.x' },
        { label: 'Python 3.12', value: 'python3.12' },
        { label: 'Java 21', value: 'java21' },
        { label: 'Go 1.x', value: 'go1.x' },
      ],
    },
    {
      key: 'handler',
      label: 'Handler',
      type: 'text',
      required: true,
      description: 'The function handler',
      placeholder: 'index.handler',
    },
    {
      key: 'memory_size',
      label: 'Memory (MB)',
      type: 'number',
      required: false,
      description: 'The memory size in MB',
      defaultValue: 128,
      validation: { min: 128, max: 10240, message: 'Must be between 128 and 10240 MB' },
    },
    {
      key: 'timeout',
      label: 'Timeout (s)',
      type: 'number',
      required: false,
      description: 'The timeout in seconds',
      defaultValue: 3,
      validation: { min: 1, max: 900, message: 'Must be between 1 and 900 seconds' },
    },
    {
      key: 'ephemeral_storage_size',
      label: 'Ephemeral Storage (MB)',
      type: 'number',
      required: false,
      description: 'The ephemeral storage size in MB',
      defaultValue: 512,
      validation: { min: 512, max: 10240, message: 'Must be between 512 and 10240 MB' },
    },
  ],

  aws_ecs_cluster: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the ECS cluster',
    },
    {
      key: 'setting',
      label: 'Setting',
      type: 'text',
      required: false,
      description: 'Cluster setting (name=value)',
    },
    {
      key: 'capacity_providers',
      label: 'Capacity Providers',
      type: 'tags',
      required: false,
      description: 'One capacity provider per line',
    },
  ],

  kubernetes_deployment: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the deployment',
    },
    {
      key: 'replicas',
      label: 'Replicas',
      type: 'number',
      required: false,
      description: 'The number of replicas',
      defaultValue: 1,
      validation: { min: 1, max: 100, message: 'Must be between 1 and 100' },
    },
    {
      key: 'image',
      label: 'Image',
      type: 'text',
      required: true,
      description: 'The container image',
      placeholder: 'nginx:latest',
    },
    {
      key: 'container_port',
      label: 'Container Port',
      type: 'number',
      required: false,
      description: 'The container port',
      defaultValue: 8080,
      validation: { min: 1, max: 65535, message: 'Must be between 1 and 65535' },
    },
  ],

  kubernetes_service: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the service',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      required: false,
      description: 'The service type',
      defaultValue: 'ClusterIP',
      options: [
        { label: 'ClusterIP', value: 'ClusterIP' },
        { label: 'NodePort', value: 'NodePort' },
        { label: 'LoadBalancer', value: 'LoadBalancer' },
      ],
    },
    {
      key: 'port',
      label: 'Port',
      type: 'number',
      required: false,
      description: 'The service port',
      defaultValue: 80,
      validation: { min: 1, max: 65535, message: 'Must be between 1 and 65535' },
    },
  ],

  kubernetes_ingress: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the ingress',
    },
    {
      key: 'hostname',
      label: 'Hostname',
      type: 'text',
      required: false,
      description: 'The ingress hostname',
      placeholder: 'example.com',
    },
    {
      key: 'tls_enabled',
      label: 'TLS Enabled',
      type: 'boolean',
      required: false,
      description: 'Enable TLS',
      defaultValue: true,
    },
  ],

  azurerm_virtual_machine: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the virtual machine',
    },
    {
      key: 'location',
      label: 'Location',
      type: 'select',
      required: false,
      description: 'The Azure region',
      defaultValue: 'eastus',
      options: [
        { label: 'East US', value: 'eastus' },
        { label: 'West Europe', value: 'westeurope' },
        { label: 'East Asia', value: 'eastasia' },
      ],
    },
    {
      key: 'vm_size',
      label: 'VM Size',
      type: 'select',
      required: false,
      description: 'The virtual machine size',
      defaultValue: 'Standard_D2s_v3',
      options: [
        { label: 'Standard_D2s_v3', value: 'Standard_D2s_v3' },
        { label: 'Standard_D4s_v3', value: 'Standard_D4s_v3' },
      ],
    },
    {
      key: 'admin_username',
      label: 'Admin Username',
      type: 'text',
      required: false,
      description: 'The admin username',
      placeholder: 'azureuser',
    },
  ],

  azurerm_virtual_network: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the virtual network',
    },
    {
      key: 'address_space',
      label: 'Address Space',
      type: 'cidr',
      required: true,
      description: 'The address space CIDR',
      defaultValue: '10.0.0.0/16',
      validation: { pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$', message: 'Invalid CIDR notation' },
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text',
      required: false,
      description: 'The Azure region',
      placeholder: 'eastus',
    },
  ],

  google_compute_instance: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the instance',
    },
    {
      key: 'machine_type',
      label: 'Machine Type',
      type: 'select',
      required: false,
      description: 'The machine type',
      defaultValue: 'e2-medium',
      options: [
        { label: 'e2-medium', value: 'e2-medium' },
        { label: 'e2-standard-2', value: 'e2-standard-2' },
        { label: 'e2-standard-4', value: 'e2-standard-4' },
      ],
    },
    {
      key: 'zone',
      label: 'Zone',
      type: 'text',
      required: false,
      description: 'The GCP zone',
      placeholder: 'us-central1-a',
    },
  ],

  google_container_cluster: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      description: 'The name of the cluster',
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text',
      required: false,
      description: 'The GCP region/zone',
      placeholder: 'us-central1',
    },
    {
      key: 'initial_node_count',
      label: 'Initial Node Count',
      type: 'number',
      required: false,
      description: 'The number of initial nodes',
      defaultValue: 3,
      validation: { min: 1, max: 100, message: 'Must be between 1 and 100' },
    },
  ],

  // ── AWS Gateway ──

  aws_internet_gateway: [
    { key: 'vpc_id', label: 'VPC ID', type: 'text', required: true, description: 'The VPC ID to attach the gateway to' },
    { key: 'tags', label: 'Tags', type: 'tags', required: false, description: 'Key=value tags, one per line' },
  ],

  aws_nat_gateway: [
    { key: 'allocation_id', label: 'Allocation ID', type: 'text', required: true, description: 'The Elastic IP allocation ID' },
    { key: 'subnet_id', label: 'Subnet ID', type: 'text', required: true, description: 'The subnet ID for the NAT gateway' },
    { key: 'connectivity_type', label: 'Connectivity Type', type: 'select', required: false, defaultValue: 'public', options: [{ label: 'Public', value: 'public' }, { label: 'Private', value: 'private' }], description: 'The connectivity type' },
  ],

  aws_route_table: [
    { key: 'vpc_id', label: 'VPC ID', type: 'text', required: true, description: 'The VPC ID' },
    { key: 'tags', label: 'Tags', type: 'tags', required: false, description: 'Key=value tags, one per line' },
  ],

  aws_autoscaling_group: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the Auto Scaling group' },
    { key: 'min_size', label: 'Min Size', type: 'number', required: false, defaultValue: 1, description: 'The minimum size of the group', validation: { min: 0, max: 100 } },
    { key: 'max_size', label: 'Max Size', type: 'number', required: false, defaultValue: 3, description: 'The maximum size of the group', validation: { min: 1, max: 1000 } },
    { key: 'desired_capacity', label: 'Desired Capacity', type: 'number', required: false, defaultValue: 2, description: 'The desired capacity', validation: { min: 0, max: 1000 } },
    { key: 'vpc_zone_identifier', label: 'Subnet IDs', type: 'tags', required: false, description: 'Subnet IDs, one per line' },
  ],

  aws_launch_template: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the launch template' },
    { key: 'image_id', label: 'AMI ID', type: 'text', required: true, description: 'The AMI to use' },
    { key: 'instance_type', label: 'Instance Type', type: 'select', required: false, defaultValue: 't3.medium', options: [{ label: 't2.micro', value: 't2.micro' }, { label: 't3.medium', value: 't3.medium' }, { label: 't3.large', value: 't3.large' }, { label: 'm5.large', value: 'm5.large' }, { label: 'm5.xlarge', value: 'm5.xlarge' }], description: 'The instance type' },
    { key: 'key_name', label: 'Key Pair', type: 'text', required: false, description: 'The key pair name' },
  ],

  aws_rds_cluster: [
    { key: 'cluster_identifier', label: 'Cluster Identifier', type: 'text', required: true, description: 'The cluster identifier' },
    { key: 'engine', label: 'Engine', type: 'select', required: false, defaultValue: 'aurora-postgresql', options: [{ label: 'Aurora PostgreSQL', value: 'aurora-postgresql' }, { label: 'Aurora MySQL', value: 'aurora-mysql' }], description: 'The database engine' },
    { key: 'engine_version', label: 'Engine Version', type: 'text', required: false, description: 'The engine version', placeholder: 'e.g. 16.4' },
    { key: 'database_name', label: 'Database Name', type: 'text', required: false, description: 'The name of the database' },
    { key: 'master_username', label: 'Master Username', type: 'text', required: false, description: 'The master username' },
    { key: 'master_password', label: 'Master Password', type: 'text', required: false, description: 'The master password' },
    { key: 'skip_final_snapshot', label: 'Skip Final Snapshot', type: 'boolean', required: false, defaultValue: true, description: 'Skip the final snapshot on deletion' },
  ],

  aws_elasticache_cluster: [
    { key: 'cluster_id', label: 'Cluster ID', type: 'text', required: true, description: 'The cluster identifier' },
    { key: 'engine', label: 'Engine', type: 'select', required: false, defaultValue: 'redis', options: [{ label: 'Redis', value: 'redis' }, { label: 'Memcached', value: 'memcached' }], description: 'The cache engine' },
    { key: 'node_type', label: 'Node Type', type: 'select', required: false, defaultValue: 'cache.t3.micro', options: [{ label: 'cache.t3.micro', value: 'cache.t3.micro' }, { label: 'cache.t3.small', value: 'cache.t3.small' }, { label: 'cache.t3.medium', value: 'cache.t3.medium' }, { label: 'cache.r6g.large', value: 'cache.r6g.large' }], description: 'The node type' },
    { key: 'num_cache_nodes', label: 'Number of Nodes', type: 'number', required: false, defaultValue: 1, description: 'The number of cache nodes', validation: { min: 1, max: 20 } },
    { key: 'parameter_group_name', label: 'Parameter Group', type: 'text', required: false, description: 'The parameter group name' },
  ],

  aws_dynamodb_table: [
    { key: 'name', label: 'Table Name', type: 'text', required: true, description: 'The name of the DynamoDB table' },
    { key: 'billing_mode', label: 'Billing Mode', type: 'select', required: false, defaultValue: 'PAY_PER_REQUEST', options: [{ label: 'Pay per Request', value: 'PAY_PER_REQUEST' }, { label: 'Provisioned', value: 'PROVISIONED' }], description: 'The billing mode' },
    { key: 'hash_key', label: 'Partition Key', type: 'text', required: true, description: 'The partition key attribute name' },
    { key: 'range_key', label: 'Sort Key', type: 'text', required: false, description: 'The sort key attribute name' },
  ],

  aws_lb_target_group: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the target group' },
    { key: 'port', label: 'Port', type: 'number', required: false, defaultValue: 80, description: 'The port', validation: { min: 1, max: 65535 } },
    { key: 'protocol', label: 'Protocol', type: 'select', required: false, defaultValue: 'HTTP', options: [{ label: 'HTTP', value: 'HTTP' }, { label: 'HTTPS', value: 'HTTPS' }, { label: 'TCP', value: 'TCP' }], description: 'The protocol' },
    { key: 'target_type', label: 'Target Type', type: 'select', required: false, defaultValue: 'instance', options: [{ label: 'Instance', value: 'instance' }, { label: 'IP', value: 'ip' }, { label: 'Lambda', value: 'lambda' }], description: 'The target type' },
    { key: 'vpc_id', label: 'VPC ID', type: 'text', required: true, description: 'The VPC ID' },
  ],

  aws_ebs_volume: [
    { key: 'availability_zone', label: 'Availability Zone', type: 'text', required: true, description: 'The AZ for the volume', placeholder: 'us-east-1a' },
    { key: 'size', label: 'Size (GB)', type: 'number', required: false, defaultValue: 20, description: 'The size in GB', validation: { min: 1, max: 16384 } },
    { key: 'volume_type', label: 'Volume Type', type: 'select', required: false, defaultValue: 'gp3', options: [{ label: 'gp2', value: 'gp2' }, { label: 'gp3', value: 'gp3' }, { label: 'io1', value: 'io1' }, { label: 'st1', value: 'st1' }, { label: 'sc1', value: 'sc1' }], description: 'The volume type' },
    { key: 'encrypted', label: 'Encrypted', type: 'boolean', required: false, defaultValue: false, description: 'Enable encryption' },
  ],

  aws_efs_file_system: [
    { key: 'performance_mode', label: 'Performance Mode', type: 'select', required: false, defaultValue: 'generalPurpose', options: [{ label: 'General Purpose', value: 'generalPurpose' }, { label: 'Max I/O', value: 'maxIO' }], description: 'The performance mode' },
    { key: 'throughput_mode', label: 'Throughput Mode', type: 'select', required: false, defaultValue: 'bursting', options: [{ label: 'Bursting', value: 'bursting' }, { label: 'Provisioned', value: 'provisioned' }], description: 'The throughput mode' },
    { key: 'encrypted', label: 'Encrypted', type: 'boolean', required: false, defaultValue: true, description: 'Enable encryption' },
  ],

  aws_network_acl: [
    { key: 'vpc_id', label: 'VPC ID', type: 'text', required: true, description: 'The VPC ID' },
    { key: 'tags', label: 'Tags', type: 'tags', required: false, description: 'Key=value tags, one per line' },
  ],

  aws_ecr_repository: [
    { key: 'name', label: 'Repository Name', type: 'text', required: true, description: 'The name of the repository' },
    { key: 'image_tag_mutability', label: 'Tag Mutability', type: 'select', required: false, defaultValue: 'MUTABLE', options: [{ label: 'Mutable', value: 'MUTABLE' }, { label: 'Immutable', value: 'IMMUTABLE' }], description: 'The tag mutability setting' },
    { key: 'scan_on_push', label: 'Scan on Push', type: 'boolean', required: false, defaultValue: true, description: 'Enable vulnerability scanning on push' },
  ],

  aws_sqs_queue: [
    { key: 'name', label: 'Queue Name', type: 'text', required: true, description: 'The name of the queue' },
    { key: 'delay_seconds', label: 'Delay (s)', type: 'number', required: false, defaultValue: 0, description: 'The delay in seconds', validation: { min: 0, max: 900 } },
    { key: 'max_message_size', label: 'Max Message Size (KB)', type: 'number', required: false, defaultValue: 256, description: 'The max message size in KB', validation: { min: 1024, max: 262144 } },
    { key: 'visibility_timeout_seconds', label: 'Visibility Timeout (s)', type: 'number', required: false, defaultValue: 30, description: 'The visibility timeout', validation: { min: 0, max: 43200 } },
  ],

  aws_sns_topic: [
    { key: 'name', label: 'Topic Name', type: 'text', required: true, description: 'The name of the topic' },
    { key: 'display_name', label: 'Display Name', type: 'text', required: false, description: 'The display name for email subscriptions' },
    { key: 'fifo_topic', label: 'FIFO Topic', type: 'boolean', required: false, defaultValue: false, description: 'Enable FIFO ordering' },
  ],

  aws_cloudwatch_metric_alarm: [
    { key: 'alarm_name', label: 'Alarm Name', type: 'text', required: true, description: 'The name of the alarm' },
    { key: 'metric_name', label: 'Metric Name', type: 'text', required: true, description: 'The metric to monitor', placeholder: 'CPUUtilization' },
    { key: 'comparison_operator', label: 'Comparison Operator', type: 'select', required: false, defaultValue: 'GreaterThanThreshold', options: [{ label: 'GreaterThanThreshold', value: 'GreaterThanThreshold' }, { label: 'LessThanThreshold', value: 'LessThanThreshold' }, { label: 'GreaterThanOrEqualToThreshold', value: 'GreaterThanOrEqualToThreshold' }], description: 'The comparison operator' },
    { key: 'evaluation_periods', label: 'Evaluation Periods', type: 'number', required: false, defaultValue: 2, description: 'The number of evaluation periods', validation: { min: 1, max: 100 } },
    { key: 'threshold', label: 'Threshold', type: 'number', required: true, description: 'The alarm threshold value' },
    { key: 'alarm_description', label: 'Description', type: 'text', required: false, description: 'The alarm description' },
  ],

  // ── Azure Resources ──

  azurerm_subnet: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the subnet' },
    { key: 'resource_group_name', label: 'Resource Group', type: 'text', required: true, description: 'The resource group name' },
    { key: 'virtual_network_name', label: 'VNet Name', type: 'text', required: true, description: 'The virtual network name' },
    { key: 'address_prefixes', label: 'Address Prefixes', type: 'cidr', required: true, description: 'The address prefix CIDR', defaultValue: '10.0.1.0/24' },
  ],

  azurerm_kubernetes_cluster: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the AKS cluster' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The Azure region', placeholder: 'eastus' },
    { key: 'dns_prefix', label: 'DNS Prefix', type: 'text', required: true, description: 'The DNS prefix of the cluster' },
    { key: 'default_node_pool_count', label: 'Node Count', type: 'number', required: false, defaultValue: 3, description: 'The number of nodes', validation: { min: 1, max: 100 } },
    { key: 'default_node_pool_size', label: 'Node VM Size', type: 'select', required: false, defaultValue: 'Standard_D2s_v3', options: [{ label: 'Standard_D2s_v3', value: 'Standard_D2s_v3' }, { label: 'Standard_D4s_v3', value: 'Standard_D4s_v3' }, { label: 'Standard_D8s_v3', value: 'Standard_D8s_v3' }], description: 'The VM size for nodes' },
    { key: 'kubernetes_version', label: 'K8s Version', type: 'text', required: false, description: 'The Kubernetes version', placeholder: '1.30' },
  ],

  azurerm_application_gateway: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the Application Gateway' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The Azure region', placeholder: 'eastus' },
    { key: 'sku_name', label: 'SKU Name', type: 'select', required: false, defaultValue: 'Standard_v2', options: [{ label: 'Standard_v2', value: 'Standard_v2' }, { label: 'WAF_v2', value: 'WAF_v2' }], description: 'The SKU name' },
    { key: 'sku_tier', label: 'SKU Tier', type: 'select', required: false, defaultValue: 'Standard_v2', options: [{ label: 'Standard_v2', value: 'Standard_v2' }, { label: 'WAF_v2', value: 'WAF_v2' }], description: 'The SKU tier' },
    { key: 'capacity', label: 'Capacity', type: 'number', required: false, defaultValue: 2, description: 'The instance count', validation: { min: 1, max: 125 } },
  ],

  azurerm_mssql_database: [
    { key: 'name', label: 'Database Name', type: 'text', required: true, description: 'The name of the SQL database' },
    { key: 'server_id', label: 'Server ID', type: 'text', required: true, description: 'The MSSQL server ID' },
    { key: 'collation', label: 'Collation', type: 'text', required: false, defaultValue: 'SQL_Latin1_General_CP1_CI_AS', description: 'The collation setting' },
    { key: 'max_size_gb', label: 'Max Size (GB)', type: 'number', required: false, defaultValue: 256, description: 'The maximum size in GB', validation: { min: 1, max: 4096 } },
    { key: 'sku_name', label: 'SKU Name', type: 'select', required: false, defaultValue: 'GP_S_Gen5_2', options: [{ label: 'GP_S_Gen5_1', value: 'GP_S_Gen5_1' }, { label: 'GP_S_Gen5_2', value: 'GP_S_Gen5_2' }, { label: 'GP_S_Gen5_4', value: 'GP_S_Gen5_4' }, { label: 'BC_Gen5_2', value: 'BC_Gen5_2' }], description: 'The service tier and hardware' },
  ],

  azurerm_storage_account: [
    { key: 'name', label: 'Account Name', type: 'text', required: true, description: 'The globally unique storage account name' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The Azure region', placeholder: 'eastus' },
    { key: 'account_tier', label: 'Account Tier', type: 'select', required: false, defaultValue: 'Standard', options: [{ label: 'Standard', value: 'Standard' }, { label: 'Premium', value: 'Premium' }], description: 'The performance tier' },
    { key: 'account_replication_type', label: 'Replication', type: 'select', required: false, defaultValue: 'LRS', options: [{ label: 'LRS', value: 'LRS' }, { label: 'GRS', value: 'GRS' }, { label: 'RA-GRS', value: 'RA-GRS' }, { label: 'ZRS', value: 'ZRS' }], description: 'The replication strategy' },
  ],

  azurerm_function_app: [
    { key: 'name', label: 'Function App Name', type: 'text', required: true, description: 'The name of the Function App' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The Azure region', placeholder: 'eastus' },
    { key: 'app_service_plan_id', label: 'App Service Plan ID', type: 'text', required: true, description: 'The App Service Plan ID' },
    { key: 'runtime', label: 'Runtime', type: 'select', required: false, defaultValue: 'node', options: [{ label: 'Node.js', value: 'node' }, { label: 'Python', value: 'python' }, { label: 'DotNet', value: 'dotnet' }, { label: 'Java', value: 'java' }], description: 'The runtime stack' },
    { key: 'https_only', label: 'HTTPS Only', type: 'boolean', required: false, defaultValue: true, description: 'Enable HTTPS only' },
  ],

  azurerm_network_security_group: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The name of the NSG' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The Azure region', placeholder: 'eastus' },
    { key: 'tags', label: 'Tags', type: 'tags', required: false, description: 'Key=value tags, one per line' },
  ],

  // ── GCP Resources ──

  google_compute_network: [
    { key: 'name', label: 'Network Name', type: 'text', required: true, description: 'The name of the VPC network' },
    { key: 'auto_create_subnetworks', label: 'Auto-create Subnets', type: 'boolean', required: false, defaultValue: false, description: 'Enable auto-creation of subnets' },
    { key: 'routing_mode', label: 'Routing Mode', type: 'select', required: false, defaultValue: 'REGIONAL', options: [{ label: 'Regional', value: 'REGIONAL' }, { label: 'Global', value: 'GLOBAL' }], description: 'The routing mode' },
    { key: 'mtu', label: 'MTU', type: 'number', required: false, defaultValue: 1460, description: 'The MTU value', validation: { min: 1460, max: 8896 } },
  ],

  google_compute_subnetwork: [
    { key: 'name', label: 'Subnet Name', type: 'text', required: true, description: 'The name of the subnet' },
    { key: 'network', label: 'Network Name', type: 'text', required: true, description: 'The VPC network name' },
    { key: 'region', label: 'Region', type: 'text', required: false, description: 'The GCP region', placeholder: 'us-central1' },
    { key: 'ip_cidr_range', label: 'IP CIDR Range', type: 'cidr', required: true, description: 'The IP CIDR range', defaultValue: '10.0.0.0/24' },
    { key: 'private_ip_google_access', label: 'Private Google Access', type: 'boolean', required: false, defaultValue: false, description: 'Enable access to Google APIs from private IPs' },
  ],

  google_storage_bucket: [
    { key: 'name', label: 'Bucket Name', type: 'text', required: true, description: 'The globally unique bucket name' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The GCP location', placeholder: 'US' },
    { key: 'storage_class', label: 'Storage Class', type: 'select', required: false, defaultValue: 'STANDARD', options: [{ label: 'Standard', value: 'STANDARD' }, { label: 'Nearline', value: 'NEARLINE' }, { label: 'Coldline', value: 'COLDLINE' }, { label: 'Archive', value: 'ARCHIVE' }], description: 'The storage class' },
    { key: 'versioning', label: 'Versioning', type: 'boolean', required: false, defaultValue: false, description: 'Enable object versioning' },
    { key: 'uniform_bucket_level_access', label: 'Uniform Access', type: 'boolean', required: false, defaultValue: true, description: 'Enable uniform bucket-level access' },
  ],

  google_cloud_run_service: [
    { key: 'name', label: 'Service Name', type: 'text', required: true, description: 'The name of the Cloud Run service' },
    { key: 'location', label: 'Location', type: 'text', required: false, description: 'The GCP region', placeholder: 'us-central1' },
    { key: 'image', label: 'Container Image', type: 'text', required: true, description: 'The container image URL', placeholder: 'gcr.io/project/image:tag' },
    { key: 'min_instances', label: 'Min Instances', type: 'number', required: false, defaultValue: 0, description: 'The minimum number of instances', validation: { min: 0, max: 100 } },
    { key: 'max_instances', label: 'Max Instances', type: 'number', required: false, defaultValue: 10, description: 'The maximum number of instances', validation: { min: 1, max: 1000 } },
    { key: 'cpu', label: 'CPU', type: 'number', required: false, defaultValue: 1, description: 'The CPU count', validation: { min: 0.5, max: 8 } },
    { key: 'memory', label: 'Memory', type: 'text', required: false, defaultValue: '512Mi', description: 'The memory allocation', placeholder: '512Mi, 1Gi, 2Gi' },
  ],

  google_sql_database_instance: [
    { key: 'name', label: 'Instance Name', type: 'text', required: true, description: 'The name of the Cloud SQL instance' },
    { key: 'database_version', label: 'Database Version', type: 'select', required: false, defaultValue: 'POSTGRES_16', options: [{ label: 'PostgreSQL 16', value: 'POSTGRES_16' }, { label: 'PostgreSQL 15', value: 'POSTGRES_15' }, { label: 'MySQL 8.0', value: 'MYSQL_8_0' }], description: 'The database version' },
    { key: 'region', label: 'Region', type: 'text', required: false, description: 'The GCP region', placeholder: 'us-central1' },
    { key: 'tier', label: 'Tier', type: 'select', required: false, defaultValue: 'db-f1-micro', options: [{ label: 'db-f1-micro', value: 'db-f1-micro' }, { label: 'db-g1-small', value: 'db-g1-small' }, { label: 'db-custom-1-3840', value: 'db-custom-1-3840' }, { label: 'db-custom-2-7680', value: 'db-custom-2-7680' }], description: 'The machine tier' },
    { key: 'disk_size', label: 'Disk Size (GB)', type: 'number', required: false, defaultValue: 20, description: 'The disk size in GB', validation: { min: 10, max: 30720 } },
    { key: 'disk_type', label: 'Disk Type', type: 'select', required: false, defaultValue: 'PD_SSD', options: [{ label: 'SSD', value: 'PD_SSD' }, { label: 'HDD', value: 'PD_STANDARD' }], description: 'The disk type' },
  ],

  // ── K8s Resources ──

  kubernetes_namespace: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The namespace name' },
    { key: 'labels', label: 'Labels', type: 'tags', required: false, description: 'Key=value labels, one per line' },
  ],

  kubernetes_config_map: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The ConfigMap name' },
    { key: 'data', label: 'Data', type: 'tags', required: false, description: 'Key=value entries, one per line' },
  ],

  kubernetes_secret: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The Secret name' },
    { key: 'type', label: 'Type', type: 'select', required: false, defaultValue: 'Opaque', options: [{ label: 'Opaque', value: 'Opaque' }, { label: 'kubernetes.io/dockerconfigjson', value: 'kubernetes.io/dockerconfigjson' }, { label: 'kubernetes.io/tls', value: 'kubernetes.io/tls' }], description: 'The secret type' },
    { key: 'data', label: 'Data', type: 'tags', required: false, description: 'Base64-encoded key=value pairs, one per line' },
  ],

  kubernetes_persistent_volume_claim: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The PVC name' },
    { key: 'storage_class_name', label: 'Storage Class', type: 'text', required: false, description: 'The storage class name', placeholder: 'standard' },
    { key: 'access_modes', label: 'Access Modes', type: 'select', required: false, defaultValue: 'ReadWriteOnce', options: [{ label: 'ReadWriteOnce (RWO)', value: 'ReadWriteOnce' }, { label: 'ReadOnlyMany (ROX)', value: 'ReadOnlyMany' }, { label: 'ReadWriteMany (RWX)', value: 'ReadWriteMany' }], description: 'The access mode' },
    { key: 'storage', label: 'Storage Size', type: 'text', required: false, defaultValue: '10Gi', description: 'The storage size', placeholder: '10Gi, 100Gi, 1Ti' },
  ],

  kubernetes_horizontal_pod_autoscaler: [
    { key: 'name', label: 'Name', type: 'text', required: true, description: 'The HPA name' },
    { key: 'min_replicas', label: 'Min Replicas', type: 'number', required: false, defaultValue: 1, description: 'The minimum number of replicas', validation: { min: 1, max: 100 } },
    { key: 'max_replicas', label: 'Max Replicas', type: 'number', required: false, defaultValue: 10, description: 'The maximum number of replicas', validation: { min: 1, max: 1000 } },
    { key: 'target_cpu_utilization', label: 'Target CPU %', type: 'number', required: false, defaultValue: 80, description: 'The target CPU utilization percentage', validation: { min: 1, max: 100 } },
  ],
}

export function getSchema(resourceType: string): PropertyField[] {
  return schemas[resourceType] ?? []
}

export function getAllSchemas(): Record<string, PropertyField[]> {
  return { ...schemas }
}
