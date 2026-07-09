# CloudBuilder — Oracle Cloud Free Tier
# Gerado automaticamente em 2026-07-08

# ─── OCI Authentication ────────────────────────────────────────────────────
tenancy_ocid     = "ocid1.tenancy.oc1..aaaaaaaa3wdvrobn2k7rjh6wjyvv5xdnihdvqiylhsnq3acsjdeh4kpnutua"
user_ocid        = "ocid1.user.oc1..aaaaaaaaakyso4bg54xnmrtmkunveqoq4wahtmjltn3v2pesnu6fhnim2eoq"
fingerprint      = "68:fc:c0:eb:f6:82:db:40:c1:88:78:d2:b4:37:b2:64"
private_key_path = "C:/Users/Mateus Alves Bassane/.oci/oci_api_key.pem"
region           = "sa-saopaulo-1"

# ─── Compartment (usar Tenancy como root compartment) ──────────────────────
compartment_ocid = "ocid1.tenancy.oc1..aaaaaaaa3wdvrobn2k7rjh6wjyvv5xdnihdvqiylhsnq3acsjdeh4kpnutua"

# ─── Instance Config ───────────────────────────────────────────────────────
# ARM Always Free tier (4 OCPU, 24GB) — requires quota approval
instance_shape    = "VM.Standard.A1.Flex"
ocpus             = 4
memory_in_gbs     = 24

# SSH public key (use existing key pair)
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDctNlUHBwel+dv+k0folRMQwKVT3lfurwPpBuplf9leX16CZkAIGlbGW9oFpTGSIZjLIzH/vwwXmHVr2difSh/KDWf3G/Wo8x6cWNopNhXt/Uqz5uCc2ZqQ3o++F7KzJxJzHCjf0Mofw4y+Z3wyFI8Zf/esel0tPJWddQy9RMtEhRaQzwEGyVkZWSHAJKOJKwFvh40JifFT/GB1xdtS1nR2/jqt4pHKF84i7wFqqpUNPGerQjeDIxIxZoBlPjOZorLlp0mk7noPpgMBkI1w7niDzIacuikIEV5i11dlY8LgSgEV90Bg1w6QRBGlIq/aJAVRw2uo4UNUKk7MxVhL694ZuhvxxwfNXScTmgaMu+Uf4g4hS9oEcPSh22KHPUYxTdtQXncm2qIKzlNn78vohbHXdULmjxw8AJzhoe79FUnajpHmTnLz2kkzapgwR1zfRjvkKJyiducn8O2j+wwZ48iuKMtrXD730KUo5QQYcHnOuHKxJWGAnOuiprOQsFYHThO6LdgyyY0PbzE18hJs+2KYORIRC+Lnb/h8yimPc48nWazfQ5aD53383kUO28tPZdPjUCeiJmfDJ3Sy5PgvmHMVgdDQkB7rcWR2noseqoJDZWSaFByWjyet4YJB3v3K7Oqb3UxvBTWWYU98ob1YbqZ1JGGOrOgMDSjPBKjsvaGJQ== Mateus Alves Bassane@SAIFORAOU"
