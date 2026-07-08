package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	grpcserver "github.com/cloudbuilder/provision-engine/internal/api/grpc"
	pb "github.com/cloudbuilder/provision-engine/internal/api/grpc/proto"
	"github.com/cloudbuilder/provision-engine/internal/collaboration"
	"github.com/cloudbuilder/provision-engine/internal/messaging"
)

var (
	grpcPort        = "50051"
	healthPort      = "50052"
	collabPort      = "8765"
	jwtSecret       = ""
	logLevel        = "info"
	kafkaEnabled    = false
	kafkaBrokers    = "localhost:9092"
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
	rootCmd.Flags().StringVar(&healthPort, "health-port", "50052", "HTTP health check server port")
	rootCmd.Flags().StringVarP(&logLevel, "log-level", "l", "info", "Log level (debug, info, warn, error)")
	rootCmd.Flags().BoolVar(&kafkaEnabled, "kafka", false, "Enable Kafka event egress to Java backend")
	rootCmd.Flags().StringVar(&kafkaBrokers, "kafka-brokers", "localhost:9092", "Comma-separated Kafka broker addresses")
	collabCmd.Flags().StringVarP(&collabPort, "port", "p", "8765", "WebSocket server port")
	collabCmd.Flags().StringVar(&jwtSecret, "jwt-secret", "", "JWT secret for auth (or set JWT_SECRET env)")
	rootCmd.AddCommand(collabCmd)
}

func startServer() {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", grpcPort))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", grpcPort, err)
	}

	// Build Kafka producer (no-op when --kafka=false)
	brokers := strings.Split(kafkaBrokers, ",")
	kp := messaging.NewKafkaProducer(messaging.KafkaConfig{
		Brokers:      brokers,
		Enabled:      kafkaEnabled,
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
		BatchSize:    100,
		BatchTimeout: time.Second,
	})

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(loggingInterceptor),
	)
	pb.RegisterProvisionServiceServer(grpcServer, grpcserver.NewProvisionServerWithKafka(kp))
	reflection.Register(grpcServer)

	// Register gRPC health service (standard health checking protocol)
	healthSrv := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthSrv)
	healthSrv.SetServingStatus("provision.ProvisionService", grpc_health_v1.HealthCheckResponse_SERVING)

	go func() {
		log.Printf("Provision Engine gRPC server listening on :%s (kafka=%v)", grpcPort, kafkaEnabled)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// HTTP health endpoint for Docker/container health checks
	httpHealth := &http.Server{
		Addr: fmt.Sprintf(":%s", healthPort),
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/health" {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, `{"status":"UP","service":"provision-engine","grpc_port":"%s"}`, grpcPort)
		}),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("Provision Engine HTTP health endpoint listening on :%s/health", healthPort)
		if err := httpHealth.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start HTTP health server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown: mark as NOT_SERVING before stopping
	healthSrv.SetServingStatus("provision.ProvisionService", grpc_health_v1.HealthCheckResponse_NOT_SERVING)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	httpHealth.Shutdown(ctx)

	grpcServer.GracefulStop()
	kp.Close()
}

func startCollabServer() {
	addr := fmt.Sprintf(":%s", collabPort)

	// Resolve JWT secret: flag > env var > nil (dev mode, no auth)
	secret := jwtSecret
	if secret == "" {
		secret = os.Getenv("JWT_SECRET")
	}

	var opts []collaboration.ServerOption
	if secret != "" {
		opts = append(opts, collaboration.WithJWTSecret([]byte(secret)))
		log.Printf("Collaboration server: JWT authentication enabled")
	} else {
		log.Printf("Collaboration server: WARNING — no JWT secret, authentication disabled (dev mode)")
	}

	server := collaboration.NewServer(addr, opts...)

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
