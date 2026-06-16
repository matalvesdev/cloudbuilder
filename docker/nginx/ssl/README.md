# SSL Certificates

Gere os certificados TLS antes de iniciar o Docker Compose:

```bash
# Self-signed para desenvolvimento
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/cloudbuilder.key \
  -out docker/nginx/ssl/cloudbuilder.crt \
  -subj "/CN=cloudbuilder.io" -addext "subjectAltName=DNS:cloudbuilder.io,DNS:api.cloudbuilder.io,DNS:grafana.cloudbuilder.io"
```

Para produção, substitua por certificados de uma CA confiável (Let's Encrypt, etc.).
