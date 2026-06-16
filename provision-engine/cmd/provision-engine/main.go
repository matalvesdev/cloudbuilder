package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	grpcserver "github.com/cloudbuilder/provision-engine/internal/api/grpc"
	pb "github.com/cloudbuilder/provision-engine/internal/api/grpc/proto"
	"github.com/cloudbuilder/provision-engine/internal/collaboration"
)

var (
	grpcPort        = "50051"
	collabPort      = "8765"
	logLevel        = "info"
)

var rootCmd = &cobra.Command{
	Use:   "provision-engine",
	Short: "CloudBuilder Provision Engine",
	Long:  `Generates Terraform/OpenTofu code and manages infrastructure deployment lifecycle.`,
	Run: func(cmd *cobra.Command, args []string) {
		startServer()
	},
}

var collabCmd = &cobra.Command{
	Use:   "collab-server",
	Short: "Start the real-time collaboration WebSocket server",
	Long:  `Starts the WebSocket server for real-time collaborative canvas editing using Yjs CRDT.`,
	Run: func(cmd *cobra.Command, args []string) {
		startCollabServer()
	},
}

func init() {
	rootCmd.Flags().StringVarP(&grpcPort, "port", "p", "50051", "gRPC server port")
	rootCmd.Flags().StringVarP(&logLevel, "log-level", "l", "info", "Log level (debug, info, warn, error)")
	collabCmd.Flags().StringVarP(&collabPort, "port", "p", "8765", "WebSocket server port")
	rootCmd.AddCommand(collabCmd)
}

func startServer() {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", grpcPort))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", grpcPort, err)
	}

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(loggingInterceptor),
	)
	pb.RegisterProvisionServiceServer(grpcServer, grpcserver.NewProvisionServer())
	reflection.Register(grpcServer)

	go func() {
		log.Printf("Provision Engine gRPC server listening on :%s", grpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
	grpcServer.GracefulStop()
}

func startCollabServer() {
	addr := fmt.Sprintf(":%s", collabPort)
	server := collaboration.NewServer(addr)

	go func() {
		log.Printf("Collaboration WebSocket server listening on %s/ws", addr)
		if err := server.Start(); err != nil {
			log.Fatalf("Failed to start collaboration server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down collaboration server...")
}

func loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	log.Printf("gRPC call: %s", info.FullMethod)
	return handler(ctx, req)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
