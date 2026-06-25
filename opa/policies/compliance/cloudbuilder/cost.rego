package compliance.cloudbuilder.cost

import future.keywords.if
import future.keywords.in

default allow := false

# Cost threshold: alert if projected > 80% of budget
allow if {
    input.resourceType == "budget"
    input.projectedCost / input.budgetLimit < 0.8
}

# Cost: prefer t3 instance families over t2/m5
allow if {
    input.resourceType in {"ec2_instance", "rds_instance", "elasticache", "node_group"}
    not startswith(input.instanceType, "t2.")
    not startswith(input.instanceType, "m5.")
    not startswith(input.instanceType, "dc2.")
}

# RDS backup retention must be > 0
allow if {
    input.resourceType == "rds_instance"
    input.backupRetentionDays > 0
}
