package compliance.cloudbuilder.governance

import future.keywords.if
import future.keywords.in

default allow := false

# All resources must have Environment and CostCenter tags
allow if {
    input.resourceType != ""
    input.tags.Environment != ""
    input.tags.CostCenter != ""
}

# Resources must be deployed in approved regions
allow if {
    input.resourceType in {"ec2_instance", "rds_instance", "s3_bucket"}
    input.region in ["us-east-1", "us-west-2", "eu-west-1", "sa-east-1"]
}

# Budget must be defined for each environment
allow if {
    input.resourceType == "environment"
    input.budgetLimit > 0
}
