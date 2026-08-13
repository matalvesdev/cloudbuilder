package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/spf13/cobra"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"github.com/cloudbuilder/provision-engine/internal/collaboration"
	"github.com/cloudbuilder/provision-engine/internal/config"
	"github.com/cloudbuilder/provision-engine/internal/messaging"
)

// Build-time variables (injected via -ldflags).
var (
	version   = "dev"
	gitCommit = "unknown"
	buildDate = "unknown"
)

var cfg *config.Config
var log zerolog.Logger

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

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	Run: func(cmd *cobra.Command, args []string) {
		info := map[string]string{
			"version":    version,
			"git_commit": gitCommit,
			"build_date": buildDate,
			"go_version": fmt.Sprintf("go%d.%d", 1, 23),
		}
		data, _ := json.MarshalIndent(info, "", "  ")
		fmt.Println(string(data))
	},
}

var listTemplatesCmd = &cobra.Command{
	Use:   "list-templates",
	Short: "List all available resource templates",
	Run: func(cmd *cobra.Command, args []string) {
		listTemplates()
	},
}

func init() {
	// Config from environment (12-Factor Factor III)
	cfg = config.Load()
	log = config.NewLogger(cfg)

	// CLI flags override env vars
	rootCmd.Flags().IntVarP(&cfg.GRPCPort, "port", "p", cfg.GRPCPort, "gRPC server port (env: GRPC_PORT)")
	rootCmd.Flags().IntVar(&cfg.HealthPort, "health-port", cfg.HealthPort, "HTTP health check port (env: HEALTH_PORT)")
	rootCmd.Flags().StringVarP(&cfg.LogLevel, "log-level", "l", cfg.LogLevel, "Log level: debug, info, warn, error (env: LOG_LEVEL)")
	rootCmd.Flags().StringVar(&cfg.LogFormat, "log-format", cfg.LogFormat, "Log format: json, console (env: LOG_FORMAT)")
	rootCmd.Flags().BoolVar(&cfg.KafkaEnabled, "kafka", cfg.KafkaEnabled, "Enable Kafka event egress (env: KAFKA_ENABLED)")
	rootCmd.Flags().StringSliceVar(&cfg.KafkaBrokers, "kafka-brokers", cfg.KafkaBrokers, "Kafka broker addresses (env: KAFKA_BROKERS)")

	collabCmd.Flags().IntVarP(&cfg.CollabPort, "port", "p", cfg.CollabPort, "WebSocket server port (env: COLLAB_PORT)")
	collabCmd.Flags().StringVar(&cfg.JWTSecret, "jwt-secret", cfg.JWTSecret, "JWT secret for auth (env: JWT_SECRET)")

	rootCmd.AddCommand(collabCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(listTemplatesCmd)
}

func startServer() {
	log.Info().
		Str("version", version).
		Str("commit", gitCommit).
		Bool("kafka", cfg.KafkaEnabled).
		Msg("starting provision engine")

	lis, err := net.Listen("tcp", cfg.GRPCAddr())
	if err != nil {
		log.Fatal().Err(err).Str("addr", cfg.GRPCAddr()).Msg("failed to listen")
	}

	// Build Kafka producer (no-op when disabled)
	kp := messaging.NewKafkaProducer(messaging.KafkaConfig{
		Brokers:      cfg.KafkaBrokers,
		Enabled:      cfg.KafkaEnabled,
		WriteTimeout: cfg.KafkaTimeout,
		ReadTimeout:  cfg.KafkaTimeout,
		BatchSize:    cfg.KafkaBatchSize,
		BatchTimeout: time.Second,
	})

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(loggingInterceptor),
	)
	_ = kp // Kafka producer available for future use
	reflection.Register(grpcServer)

	// gRPC health service
	healthSrv := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthSrv)
	healthSrv.SetServingStatus("provision.ProvisionService", grpc_health_v1.HealthCheckResponse_SERVING)

	// HTTP health endpoint for Docker/container health checks
	httpHealth := &http.Server{
		Addr:         cfg.HealthAddr(),
		Handler:      healthHandler(cfg),
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	go func() {
		log.Info().Str("addr", cfg.GRPCAddr()).Msg("gRPC server listening")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatal().Err(err).Msg("gRPC serve failed")
		}
	}()

	go func() {
		log.Info().Str("addr", cfg.HealthAddr()).Msg("HTTP health endpoint listening")
		if err := httpHealth.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("HTTP health server failed")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	log.Info().Str("signal", sig.String()).Msg("received shutdown signal")

	healthSrv.SetServingStatus("provision.ProvisionService", grpc_health_v1.HealthCheckResponse_NOT_SERVING)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpHealth.Shutdown(ctx); err != nil {
		log.Warn().Err(err).Msg("HTTP health shutdown error")
	}

	grpcServer.GracefulStop()

	if err := kp.Close(); err != nil {
		log.Warn().Err(err).Msg("Kafka close error")
	}

	log.Info().Msg("provision engine stopped")
}

func startCollabServer() {
	if len(cfg.JWTSecret) < 32 {
		log.Fatal().Msg("JWT_SECRET with at least 32 bytes is required for collaboration")
	}
	log.Info().
		Str("addr", cfg.CollabAddr()).
		Bool("auth", cfg.JWTSecret != "").
		Msg("starting collaboration server")

	allowedOrigins := make(map[string]struct{}, len(cfg.CollabAllowedOrigins))
	for _, origin := range cfg.CollabAllowedOrigins {
		allowedOrigins[strings.TrimSpace(origin)] = struct{}{}
	}

	server := collaboration.NewServer(
		cfg.CollabAddr(),
		collaboration.WithJWTSecret([]byte(cfg.JWTSecret)),
		collaboration.WithCheckOrigin(func(r *http.Request) bool {
			_, allowed := allowedOrigins[r.Header.Get("Origin")]
			return allowed
		}),
	)

	errCh := make(chan error, 1)
	go func() {
		errCh <- server.Start()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		log.Info().Str("signal", sig.String()).Msg("shutting down collaboration server")
	case err := <-errCh:
		log.Fatal().Err(err).Msg("collaboration server failed")
	}

	server.Stop()
	log.Info().Msg("collaboration server stopped")
}

func healthHandler(cfg *config.Config) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"UP","service":"provision-engine","version":"%s","grpc_port":%d}`,
			version, cfg.GRPCPort)
	})
}

func loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	start := time.Now()
	resp, err := handler(ctx, req)
	log.Info().
		Str("method", info.FullMethod).
		Dur("duration", time.Since(start)).
		Bool("error", err != nil).
		Msg("gRPC call")
	return resp, err
}

func listTemplates() {
	// Import templates package to list all available templates
	// This is an admin command for debugging
	fmt.Println("Available resource templates:")
	fmt.Println("  AWS:   aws_vpc, aws_subnet, aws_security_group, aws_instance, aws_s3_bucket, ...")
	fmt.Println("  Azure: azurerm_resource_group, azurerm_virtual_network, azurerm_linux_virtual_machine, ...")
	fmt.Println("  GCP:   google_compute_network, google_compute_instance, google_storage_bucket, ...")
	fmt.Println("  K8s:   kubernetes_namespace, kubernetes_deployment, kubernetes_service, ...")
	fmt.Println("")
	fmt.Println("Use 'list-templates --help' for more details.")
}

func main() {
	// Override build-time vars if set via ldflags
	if version == "" {
		version = "dev"
	}

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
