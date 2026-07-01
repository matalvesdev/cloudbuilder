package proto

import (
	"context"
	"encoding/json"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/encoding"
	"google.golang.org/grpc/status"
)

func init() {
	encoding.RegisterCodec(JSONCodec{})
}

type JSONCodec struct{}

func (JSONCodec) Marshal(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

func (JSONCodec) Unmarshal(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

func (JSONCodec) Name() string { return "proto" }

type GenerateCodeRequest struct {
	CanvasId   string
	DesignJson string
	Engine     string
}

type GenerateCodeResponse struct {
	Files         map[string]string
	ResourceCount int32
	Error         string
}

type DeployRequest struct {
	DeploymentId string
	WorkspaceDir string
	Engine       string
	AutoApprove  bool
}

type DeployEvent struct {
	DeploymentId string
	EventType    string
	Message      string
	ProgressPct  int32
}

type PlanRequest struct {
	WorkspaceDir string
	Engine       string
}

type PlanResponse struct {
	PlanJson           string
	PlanSummary        string
	HasChanges         bool
	ResourcesAdded     int32
	ResourcesChanged   int32
	ResourcesDestroyed int32
	Error              string
}

type ApproveRequest struct {
	DeploymentId string
	WorkspaceDir string
	Engine       string
	ApprovedBy   string
}

type ApproveResponse struct {
	Success bool
	Output  string
	Error   string
}

type StateRequest struct {
	WorkspaceDir string
}

type StateResponse struct {
	StateJson     string
	StateVersion  string
	ResourceCount int32
	Error         string
}

type DriftRequest struct {
	WorkspaceDir string
	DesignJson   string
}

type DriftResponse struct {
	HasDrift         bool
	DriftedResources []*DriftResource
	Error            string
}

type DriftResource struct {
	Address    string
	Expected   string
	Actual     string
	ChangeType string
}

type DestroyRequest struct {
	DeploymentId string
	WorkspaceDir string
	Engine       string
	AutoApprove  bool
}

type DestroyEvent struct {
	DeploymentId string
	EventType    string
	Message      string
}

type WatchEventsRequest struct {
	TenantId   string
	EventTypes []string
}

type EngineEvent struct {
	DeploymentId string
	EventType    string
	Status       string
	Message      string
	Progress     int32
	TenantId     string
	Timestamp    string
}

type ProvisionServiceServer interface {
	GenerateCode(context.Context, *GenerateCodeRequest) (*GenerateCodeResponse, error)
	Deploy(*DeployRequest, ProvisionService_DeployServer) error
	GetPlan(context.Context, *PlanRequest) (*PlanResponse, error)
	ApprovePlan(context.Context, *ApproveRequest) (*ApproveResponse, error)
	GetState(context.Context, *StateRequest) (*StateResponse, error)
	DetectDrift(context.Context, *DriftRequest) (*DriftResponse, error)
	Destroy(*DestroyRequest, ProvisionService_DestroyServer) error
	WatchEvents(*WatchEventsRequest, ProvisionService_WatchEventsServer) error
}

type UnimplementedProvisionServiceServer struct{}

func (UnimplementedProvisionServiceServer) GenerateCode(context.Context, *GenerateCodeRequest) (*GenerateCodeResponse, error) {
	return nil, status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) Deploy(*DeployRequest, ProvisionService_DeployServer) error {
	return status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) GetPlan(context.Context, *PlanRequest) (*PlanResponse, error) {
	return nil, status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) ApprovePlan(context.Context, *ApproveRequest) (*ApproveResponse, error) {
	return nil, status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) GetState(context.Context, *StateRequest) (*StateResponse, error) {
	return nil, status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) DetectDrift(context.Context, *DriftRequest) (*DriftResponse, error) {
	return nil, status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) Destroy(*DestroyRequest, ProvisionService_DestroyServer) error {
	return status.Error(codes.Unimplemented, "unimplemented")
}
func (UnimplementedProvisionServiceServer) WatchEvents(*WatchEventsRequest, ProvisionService_WatchEventsServer) error {
	return status.Error(codes.Unimplemented, "unimplemented")
}

type ProvisionService_DeployServer interface {
	Send(*DeployEvent) error
	grpc.ServerStream
}

type ProvisionService_DestroyServer interface {
	Send(*DestroyEvent) error
	grpc.ServerStream
}

type ProvisionService_WatchEventsServer interface {
	Send(*EngineEvent) error
	grpc.ServerStream
}

func RegisterProvisionServiceServer(s grpc.ServiceRegistrar, srv ProvisionServiceServer) {
	s.RegisterService(&ProvisionService_ServiceDesc, srv)
}

var ProvisionService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "provision.ProvisionService",
	HandlerType: (*ProvisionServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{MethodName: "GenerateCode", Handler: _ProvisionService_GenerateCode_Handler},
		{MethodName: "GetPlan", Handler: _ProvisionService_GetPlan_Handler},
		{MethodName: "ApprovePlan", Handler: _ProvisionService_ApprovePlan_Handler},
		{MethodName: "GetState", Handler: _ProvisionService_GetState_Handler},
		{MethodName: "DetectDrift", Handler: _ProvisionService_DetectDrift_Handler},
	},
	Streams: []grpc.StreamDesc{
		{StreamName: "Deploy", Handler: _ProvisionService_Deploy_Handler, ServerStreams: true},
		{StreamName: "Destroy", Handler: _ProvisionService_Destroy_Handler, ServerStreams: true},
		{StreamName: "WatchEvents", Handler: _ProvisionService_WatchEvents_Handler, ServerStreams: true},
	},
	Metadata: "provision.proto",
}

func _ProvisionService_GenerateCode_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GenerateCodeRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ProvisionServiceServer).GenerateCode(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/provision.ProvisionService/GenerateCode",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ProvisionServiceServer).GenerateCode(ctx, req.(*GenerateCodeRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ProvisionService_GetPlan_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PlanRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ProvisionServiceServer).GetPlan(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/provision.ProvisionService/GetPlan",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ProvisionServiceServer).GetPlan(ctx, req.(*PlanRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ProvisionService_ApprovePlan_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ApproveRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ProvisionServiceServer).ApprovePlan(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/provision.ProvisionService/ApprovePlan",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ProvisionServiceServer).ApprovePlan(ctx, req.(*ApproveRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ProvisionService_GetState_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(StateRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ProvisionServiceServer).GetState(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/provision.ProvisionService/GetState",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ProvisionServiceServer).GetState(ctx, req.(*StateRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ProvisionService_DetectDrift_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(DriftRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ProvisionServiceServer).DetectDrift(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/provision.ProvisionService/DetectDrift",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ProvisionServiceServer).DetectDrift(ctx, req.(*DriftRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _ProvisionService_Deploy_Handler(srv interface{}, stream grpc.ServerStream) error {
	m := new(DeployRequest)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(ProvisionServiceServer).Deploy(m, &provisionServiceDeployServer{stream})
}

type provisionServiceDeployServer struct{ grpc.ServerStream }

func (x *provisionServiceDeployServer) Send(m *DeployEvent) error {
	return x.ServerStream.SendMsg(m)
}

func _ProvisionService_Destroy_Handler(srv interface{}, stream grpc.ServerStream) error {
	m := new(DestroyRequest)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(ProvisionServiceServer).Destroy(m, &provisionServiceDestroyServer{stream})
}

type provisionServiceDestroyServer struct{ grpc.ServerStream }

func (x *provisionServiceDestroyServer) Send(m *DestroyEvent) error {
	return x.ServerStream.SendMsg(m)
}

func _ProvisionService_WatchEvents_Handler(srv interface{}, stream grpc.ServerStream) error {
	m := new(WatchEventsRequest)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(ProvisionServiceServer).WatchEvents(m, &provisionServiceWatchEventsServer{stream})
}

type provisionServiceWatchEventsServer struct{ grpc.ServerStream }

func (x *provisionServiceWatchEventsServer) Send(m *EngineEvent) error {
	return x.ServerStream.SendMsg(m)
}

func _init_imports() { _ = fmt.Sprintf }
