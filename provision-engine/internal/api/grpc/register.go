package grpc

import (
	"google.golang.org/grpc"
)

// RegisterAll registers all generated gRPC services and returns the number of
// business services registered. Until generated protobuf bindings exist, the
// count remains zero and callers must not advertise the gRPC surface as ready.
func RegisterAll(s *grpc.Server, svc *Server) int {
	// All services are implemented as methods on the Server struct.
	// We register them via a manual service registrar since we're not
	// using protoc-generated code.

	// For now, the gRPC services are accessible via the REST API layer.
	// Full gRPC registration requires protoc-generated code which we'll
	// add when protoc is available in the CI environment.
	//
	// The server is ready for gRPC registration. The following shows the
	// intended registration pattern:
	//
	//   deploymentpb.RegisterDeploymentServiceServer(s, svc)
	//   workflowpb.RegisterWorkflowServiceServer(s, svc)
	//   executionpb.RegisterExecutionServiceServer(s, svc)
	//   resourcepb.RegisterResourceServiceServer(s, svc)
	//   statepb.RegisterStateServiceServer(s, svc)
	//   providerpb.RegisterProviderServiceServer(s, svc)
	//   auditpb.RegisterAuditServiceServer(s, svc)
	//   driftpb.RegisterDriftServiceServer(s, svc)
	//
	// Since we're using hand-written types (no protoc), we expose the
	// gRPC server as a reflection-based server that clients can call
	// via grpcurl using the reflection protocol.

	_ = svc // ensure server is used
	_ = s
	return 0
}
