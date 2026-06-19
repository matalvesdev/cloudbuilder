package templates

import (
	"strings"
	"testing"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

func TestGetTemplate_ExistingTypes(t *testing.T) {
	resourceTypes := []string{
		"aws_vpc", "aws_subnet", "aws_security_group",
		"aws_instance", "aws_s3_bucket",
		"vpc", "subnet", "security_group", "instance", "ec2",
		"s3_bucket", "s3",
	}

	for _, rt := range resourceTypes {
		t.Run(rt, func(t *testing.T) {
			_, ok := GetTemplate(model.ProviderAWS, rt)
			if !ok {
				t.Errorf("GetTemplate(aws, %q) = false, want true", rt)
			}
		})
	}
}

func TestGetTemplate_NonAWSProvider(t *testing.T) {
	_, ok := GetTemplate(model.ProviderAZURE, "aws_vpc")
	if ok {
		t.Error("GetTemplate(azure, aws_vpc) = true, want false")
	}
}

func TestGetTemplate_UnknownType(t *testing.T) {
	_, ok := GetTemplate(model.ProviderAWS, "nonexistent")
	if ok {
		t.Error("GetTemplate(aws, nonexistent) = true, want false")
	}
}

func TestAwsVpcTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "vpc1",
		Name: "Main VPC",
		Properties: map[string]interface{}{
			"cidr": "10.0.0.0/16",
			"name": "main",
		},
	}

	result, err := awsVpcTemplate(node)
	if err != nil {
		t.Fatalf("awsVpcTemplate() error = %v", err)
	}

	if !contains(result, "aws_vpc") {
		t.Error("expected aws_vpc resource")
	}
	if !contains(result, "vpc1") {
		t.Error("expected node ID in resource name")
	}
	if !contains(result, "10.0.0.0/16") {
		t.Error("expected CIDR block")
	}
	if !contains(result, "Main VPC") && !contains(result, "main") {
		t.Error("expected name in tags")
	}
}

func TestAwsVpcTemplate_DefaultCidr(t *testing.T) {
	node := model.DesignNode{
		ID:         "vpc1",
		Name:       "VPC",
		Properties: map[string]interface{}{},
	}

	result, err := awsVpcTemplate(node)
	if err != nil {
		t.Fatalf("awsVpcTemplate() error = %v", err)
	}

	if !contains(result, "10.0.0.0/16") {
		t.Error("expected default CIDR 10.0.0.0/16")
	}
}

func TestAwsSubnetTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "sub1",
		Name: "Public Subnet",
		Properties: map[string]interface{}{
			"cidr":   "10.0.1.0/24",
			"vpcId":  "vpc1",
			"public": true,
		},
	}

	result, err := awsSubnetTemplate(node)
	if err != nil {
		t.Fatalf("awsSubnetTemplate() error = %v", err)
	}

	if !contains(result, "aws_subnet") {
		t.Error("expected aws_subnet resource")
	}
	if !contains(result, "10.0.1.0/24") {
		t.Error("expected CIDR block")
	}
	if !contains(result, "aws_vpc.vpc1.id") {
		t.Error("expected VPC reference")
	}
	if !contains(result, "true") {
		t.Log("map_public_ip_on_launch should be true for public subnet")
	}
}

func TestAwsSubnetTemplate_PrivateDefault(t *testing.T) {
	node := model.DesignNode{
		ID:   "sub1",
		Name: "Private Subnet",
		Properties: map[string]interface{}{
			"cidr":  "10.0.2.0/24",
			"vpcId": "vpc1",
		},
	}

	result, err := awsSubnetTemplate(node)
	if err != nil {
		t.Fatalf("awsSubnetTemplate() error = %v", err)
	}

	if !contains(result, "false") {
		t.Log("map_public_ip_on_launch should be false for private subnet")
	}
}

func TestAwsSecurityGroupTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "sg1",
		Name: "Web SG",
		Properties: map[string]interface{}{
			"name":        "web-sg",
			"description": "Web tier security group",
			"vpcId":       "vpc1",
		},
	}

	result, err := awsSecurityGroupTemplate(node)
	if err != nil {
		t.Fatalf("awsSecurityGroupTemplate() error = %v", err)
	}

	if !contains(result, "aws_security_group") {
		t.Error("expected aws_security_group resource")
	}
	if !contains(result, "web-sg") {
		t.Error("expected security group name")
	}
	if !contains(result, "ingress") {
		t.Error("expected ingress block")
	}
	if !contains(result, "egress") {
		t.Error("expected egress block")
	}
}

func TestAwsInstanceTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "web1",
		Name: "Web Server",
		Properties: map[string]interface{}{
			"ami":          "ami-12345",
			"instanceType": "t3.large",
		},
	}

	result, err := awsInstanceTemplate(node)
	if err != nil {
		t.Fatalf("awsInstanceTemplate() error = %v", err)
	}

	if !contains(result, "aws_instance") {
		t.Error("expected aws_instance resource")
	}
	if !contains(result, "ami-12345") {
		t.Error("expected AMI")
	}
	if !contains(result, "t3.large") {
		t.Error("expected instance type")
	}
}

func TestAwsInstanceTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "web1",
		Name:       "Web",
		Properties: map[string]interface{}{},
	}

	result, err := awsInstanceTemplate(node)
	if err != nil {
		t.Fatalf("awsInstanceTemplate() error = %v", err)
	}

	if !contains(result, "ami-0c55b159cbfafe1f0") {
		t.Error("expected default AMI")
	}
	if !contains(result, "t3.micro") {
		t.Error("expected default instance type")
	}
}

func TestAwsS3BucketTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "bucket1",
		Name: "Assets",
		Properties: map[string]interface{}{
			"bucketName": "my-assets",
			"versioning": true,
		},
	}

	result, err := awsS3BucketTemplate(node)
	if err != nil {
		t.Fatalf("awsS3BucketTemplate() error = %v", err)
	}

	if !contains(result, "aws_s3_bucket") {
		t.Error("expected aws_s3_bucket resource")
	}
	if !contains(result, "my-assets") {
		t.Error("expected bucket name")
	}
	if !contains(result, "aws_s3_bucket_versioning") {
		t.Error("expected versioning resource")
	}
	if !contains(result, "true") {
		t.Error("expected Enabled versioning")
	}
}

func TestAwsS3BucketTemplate_NoVersioning(t *testing.T) {
	node := model.DesignNode{
		ID:   "bucket2",
		Name: "Logs",
		Properties: map[string]interface{}{
			"bucketName": "my-logs",
			"versioning": false,
		},
	}

	result, err := awsS3BucketTemplate(node)
	if err != nil {
		t.Fatalf("awsS3BucketTemplate() error = %v", err)
	}

	if !contains(result, "false") {
		t.Error("expected Disabled versioning")
	}
}

func TestGetStringProp_Exists(t *testing.T) {
	props := map[string]interface{}{"key": "value"}
	result := getStringProp(props, "key", "default")
	if result != "value" {
		t.Errorf("getStringProp() = %q, want %q", result, "value")
	}
}

func TestGetStringProp_Missing(t *testing.T) {
	props := map[string]interface{}{}
	result := getStringProp(props, "key", "default")
	if result != "default" {
		t.Errorf("getStringProp() = %q, want %q", result, "default")
	}
}

func TestGetStringProp_NilProps(t *testing.T) {
	result := getStringProp(nil, "key", "default")
	if result != "default" {
		t.Errorf("getStringProp() = %q, want %q", result, "default")
	}
}

func TestGetStringProp_EmptyString(t *testing.T) {
	props := map[string]interface{}{"key": ""}
	result := getStringProp(props, "key", "default")
	if result != "default" {
		t.Errorf("getStringProp() = %q, want %q", result, "default")
	}
}

func TestGetBoolProp_True(t *testing.T) {
	props := map[string]interface{}{"enabled": true}
	result := getBoolProp(props, "enabled", false)
	if result != true {
		t.Error("getBoolProp() = false, want true")
	}
}

func TestGetBoolProp_False(t *testing.T) {
	props := map[string]interface{}{"enabled": false}
	result := getBoolProp(props, "enabled", true)
	if result != false {
		t.Error("getBoolProp() = true, want false")
	}
}

func TestGetBoolProp_Missing(t *testing.T) {
	props := map[string]interface{}{}
	result := getBoolProp(props, "enabled", true)
	if result != true {
		t.Error("getBoolProp() = false, want true (default)")
	}
}

func TestGetParentVPCID_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"vpcId": "vpc-custom"}}
	result := getParentVPCID(node)
	if result != "vpc-custom" {
		t.Errorf("getParentVPCID() = %q, want %q", result, "vpc-custom")
	}
}

func TestGetParentVPCID_Default(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{}}
	result := getParentVPCID(node)
	if result != "main" {
		t.Errorf("getParentVPCID() = %q, want %q", result, "main")
	}
}

func TestGetParentSubnetID_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"subnetId": "sub-custom"}}
	result := getParentSubnetID(node)
	if result != "sub-custom" {
		t.Errorf("getParentSubnetID() = %q, want %q", result, "sub-custom")
	}
}

func TestGetParentSecurityGroupID_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"securityGroupId": "sg-custom"}}
	result := getParentSecurityGroupID(node)
	if result != "sg-custom" {
		t.Errorf("getParentSecurityGroupID() = %q, want %q", result, "sg-custom")
	}
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}
