package compliance.cloudbuilder.security

import future.keywords.if
import future.keywords.in

default allow := false

# All storage resources must have encryption enabled
allow if {
    input.resourceType in {"s3_bucket", "rds_instance", "elasticache", "dynamodb", "redshift", "ebs_volume", "efs_file_system"}
    input.encryption == true
}

# S3 buckets must have encryption
allow if {
    input.resourceType == "s3_bucket"
    input.encryption != ""
    input.encryption != "None"
}

# Security groups must not allow SSH (port 22) to 0.0.0.0/0
allow if {
    input.resourceType == "security_group"
    not any_open_ssh(input.inboundRules)
}

any_open_ssh(rules) := true if {
    some rule in rules
    rule.cidr == "0.0.0.0/0"
    rule.port == 22
}

# IAM roles must have least privilege
allow if {
    input.resourceType == "iam_role"
    input.policyArity <= 3
}
