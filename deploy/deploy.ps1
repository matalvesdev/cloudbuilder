# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder — Deploy Oracle Cloud (PowerShell)
# ═══════════════════════════════════════════════════════════════════════════
# Run this from your Windows machine to deploy CloudBuilder to Oracle Cloud
#
# Prerequisites:
#   - Terraform installed (winget install HashiCorp.Terraform)
#   - OCI CLI configured (oci setup config) OR just set OCI_CONFIG
#   - SSH key pair (ssh-keygen -t ed25519 -f $HOME\.ssh\oci_key)
# ═══════════════════════════════════════════════════════════════════════════

param(
    [string]$CompartmentOcid = "",
    [string]$Action = "apply"
)

$ErrorActionPreference = "Stop"
$TerraformDir = "$PSScriptRoot\terraform-oci"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CloudBuilder — Oracle Cloud Deploy" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Check prerequisites ────────────────────────────────────────────────────
Write-Host "▶ Checking prerequisites..." -ForegroundColor Yellow

# Terraform
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "  Terraform not found. Installing..." -ForegroundColor Red
    winget install HashiCorp.Terraform
    $env:PATH += ";C:\Program Files\Terraform"
}

$terraformVersion = terraform version | Select-Object -First 1
Write-Host "  Terraform: $terraformVersion" -ForegroundColor Green

# SSH key
$sshKeyPath = "$HOME\.ssh\oci_key"
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "  SSH key not found. Generating..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $sshKeyPath -N '""'
    Write-Host "  SSH key generated at $sshKeyPath" -ForegroundColor Green
} else {
    Write-Host "  SSH key: $sshKeyPath" -ForegroundColor Green
}

# ─── Get Compartment OCID ──────────────────────────────────────────────────
if ($CompartmentOcid -eq "") {
    # Try to read from terraform.tfvars
    $tfvarsFile = "$TerraformDir\terraform.tfvars"
    if (Test-Path $tfvarsFile) {
        $content = Get-Content $tfvarsFile -Raw
        if ($content -match 'compartment_ocid\s*=\s*"([^"]+)"') {
            $CompartmentOcid = $matches[1]
        }
    }
}

if ($CompartmentOcid -eq "") {
    Write-Host ""
    Write-Host "  Compartment OCID not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  How to find it:" -ForegroundColor Yellow
    Write-Host "    1. Login to https://cloud.oracle.com"
    Write-Host "    2. Click your profile icon → Tenancy"
    Write-Host "    3. Copy the OCID value"
    Write-Host ""
    Write-Host "  Then run:"
    Write-Host "    .\deploy.ps1 -CompartmentOcid 'ocid1.compartment.oc1..xxxxx'"
    Write-Host ""
    exit 1
}

Write-Host "  Compartment: $CompartmentOcid" -ForegroundColor Green
Write-Host ""

# ─── Run Terraform ─────────────────────────────────────────────────────────
Set-Location $TerraformDir

Write-Host "▶ Initializing Terraform..." -ForegroundColor Yellow
terraform init -upgrade

Write-Host ""
Write-Host "▶ Planning deployment..." -ForegroundColor Yellow
terraform plan -var="compartment_ocid=$CompartmentOcid" -var-file="terraform.tfvars" -out=tfplan

if ($Action -eq "plan") {
    Write-Host ""
    Write-Host "  Plan complete. Run with -Action apply to deploy." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "▶ Applying deployment..." -ForegroundColor Yellow
$confirm = Read-Host "  Deploy to Oracle Cloud? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "  Cancelled." -ForegroundColor Red
    exit 0
}

terraform apply tfplan

# ─── Get outputs ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

$publicIp = terraform output -raw instance_public_ip
$sshCmd = terraform output -raw ssh_command
$frontendUrl = terraform output -raw frontend_url

Write-Host "  Public IP:    $publicIp" -ForegroundColor White
Write-Host "  SSH Command:  $sshCmd" -ForegroundColor White
Write-Host "  Frontend:     $frontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "  Services will be available in ~5 minutes after first boot." -ForegroundColor Yellow
Write-Host "  To connect:" -ForegroundColor Yellow
Write-Host "    $sshCmd" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To check deployment status:" -ForegroundColor Yellow
Write-Host "    ssh -i $sshKeyPath ubuntu@$publicIp 'docker compose ps'" -ForegroundColor Cyan
Write-Host ""
