#!/bin/bash
# Proto generation script for CloudBuilder Provision Engine
set -e

PROTO_DIR="proto"
OUT_DIR="internal/api/grpc/proto"

echo "Generating protobuf code..."

# Generate Go code from proto files
protoc \
  --proto_path="${PROTO_DIR}" \
  --go_out="${OUT_DIR}" --go_opt=paths=source_relative \
  --go-grpc_out="${OUT_DIR}" --go-grpc_opt=paths=source_relative \
  "${PROTO_DIR}"/provision/v1/*.proto \
  "${PROTO_DIR}"/events/v1/*.proto \
  "${PROTO_DIR}"/health/v1/*.proto \
  "${PROTO_DIR}"/metrics/v1/*.proto

echo "Proto generation complete."
echo "Generated files in ${OUT_DIR}/"
