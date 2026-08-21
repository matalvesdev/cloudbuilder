package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	grpcserver "github.com/cloudbuilder/provision-engine/internal/api/grpc"
	"github.com/cloudbuilder/provision-engine/internal/app"
)

var (
	version   = "dev"
	gitCommit = "unknown"
	buildDate = "unknown"
)

func main() {
	if err := newRootCmd().Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func newRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:              "provision-engine",
		Short:            "CloudBuilder Provision Engine",
		SilenceUsage:     true,
		SilenceErrors:    true,
		PersistentPreRun: func(cmd *cobra.Command, args []string) { setupLogger() },
	}
	root.PersistentFlags().String("config", "", "config file path (env: PE_CONFIG)")
	root.PersistentFlags().String("log-level", "info", "log level (env: PE_LOG_LEVEL)")
	root.PersistentFlags().String("log-format", "console", "log format: console, json (env: PE_LOG_FORMAT)")
	viper.SetEnvPrefix("PE")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
	viper.AutomaticEnv()
	_ = viper.BindPFlag("config", root.PersistentFlags().Lookup("config"))
	_ = viper.BindPFlag("log-level", root.PersistentFlags().Lookup("log-level"))
	_ = viper.BindPFlag("log-format", root.PersistentFlags().Lookup("log-format"))
	root.AddCommand(newAPICmd(), newWorkerCmd(), newSchedulerCmd(), newVersionCmd())
	return root
}

// ═══════════════════════════════════════════════════════════════════════════
// API Server — starts both HTTP + gRPC
// ═══════════════════════════════════════════════════════════════════════════

func newAPICmd() *cobra.Command {
	var testMode bool

	cmd := &cobra.Command{
		Use:   "api",
		Short: "Start the REST + gRPC API servers",
		RunE: func(cmd *cobra.Command, args []string) error {
			logger := log.Logger
			logger.Info().Str("version", version).Bool("test", testMode).Msg("starting provision-engine")

			cfg := loadConfig()

			var application *app.App
			if testMode {
				application = app.NewTest(cfg)
				logger.Warn().Msg("TEST mode — in-memory storage, no database")
			} else {
				var err error
				application, err = app.New(cfg)
				if err != nil {
					return fmt.Errorf("init app: %w", err)
				}
			}
			defer application.Close()

			// ── gRPC Server ──────────────────────────────────────────────
			grpcAddr := cfg.GRPCAddr
			if grpcAddr == "" {
				grpcAddr = ":9090"
			}

			grpcLis, err := net.Listen("tcp", grpcAddr)
			if err != nil {
				return fmt.Errorf("gRPC listen %s: %w", grpcAddr, err)
			}

			grpcSrv := grpc.NewServer()
			svc := grpcserver.NewServer(
				application.DeploymentRepo,
				application.WorkflowRepo,
				application.ExecutionRepo,
				application.ResourceRepo,
				application.StateRepo,
				application.ProviderRepo,
				application.AuditRepo,
			)
			registeredServices := grpcserver.RegisterAll(grpcSrv, svc)

			healthSrv := health.NewServer()
			if registeredServices > 0 {
				reflection.Register(grpcSrv)
				grpc_health_v1.RegisterHealthServer(grpcSrv, healthSrv)
				healthSrv.SetServingStatus("provision.v1.ProvisionEngine", grpc_health_v1.HealthCheckResponse_SERVING)
				go func() {
					logger.Info().Str("addr", grpcAddr).Msg("gRPC server listening")
					if err := grpcSrv.Serve(grpcLis); err != nil {
						logger.Error().Err(err).Msg("gRPC serve failed")
					}
				}()
			} else {
				_ = grpcLis.Close()
				logger.Warn().Msg("gRPC disabled: no generated business services are registered")
			}

			// ── HTTP Server ──────────────────────────────────────────────
			go func() {
				logger.Info().Str("addr", cfg.HTTPAddr).Msg("HTTP server listening")
				if err := application.RESTServer.Start(); err != nil {
					logger.Error().Err(err).Msg("HTTP server failed")
				}
			}()

			// ── Shutdown ─────────────────────────────────────────────────
			quit := make(chan os.Signal, 1)
			signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
			<-quit

			logger.Info().Msg("shutting down")
			if registeredServices > 0 {
				healthSrv.SetServingStatus("provision.v1.ProvisionEngine", grpc_health_v1.HealthCheckResponse_NOT_SERVING)
			}

			if registeredServices > 0 {
				grpcSrv.GracefulStop()
			}

			shutCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			defer cancel()
			_ = application.RESTServer.Shutdown(shutCtx)

			logger.Info().Msg("stopped")
			return nil
		},
	}

	cmd.Flags().BoolVar(&testMode, "test", false, "test mode with in-memory storage")
	return cmd
}

// ═══════════════════════════════════════════════════════════════════════════
// Worker / Scheduler / Version
// ═══════════════════════════════════════════════════════════════════════════

func newWorkerCmd() *cobra.Command {
	return &cobra.Command{
		Use: "worker", Short: "Start worker pool",
		RunE: func(cmd *cobra.Command, args []string) error {
			log.Info().Msg("worker started (placeholder)")
			quit := make(chan os.Signal, 1)
			signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
			<-quit
			return nil
		},
	}
}

func newSchedulerCmd() *cobra.Command {
	return &cobra.Command{
		Use: "scheduler", Short: "Start job scheduler",
		RunE: func(cmd *cobra.Command, args []string) error {
			log.Info().Msg("scheduler started (placeholder)")
			quit := make(chan os.Signal, 1)
			signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
			<-quit
			return nil
		},
	}
}

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use: "version", Short: "Print version",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("provision-engine %s (commit: %s, built: %s)\n", version, gitCommit, buildDate)
		},
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Config + Logger
// ═══════════════════════════════════════════════════════════════════════════

func loadConfig() *app.Config {
	if cfgFile := viper.GetString("config"); cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath("./configs")
	}
	_ = viper.ReadInConfig()

	cfg := app.DefaultConfig()
	if v := os.Getenv("PE_SERVER_HTTP_ADDR"); v != "" {
		cfg.HTTPAddr = v
	} else if v := os.Getenv("PORT"); v != "" {
		// PaaS providers such as Render expose the public listener port as PORT.
		cfg.HTTPAddr = ":" + v
	} else if v := viper.GetString("server.http.addr"); v != "" {
		cfg.HTTPAddr = v
	}
	if v := os.Getenv("PE_SERVER_GRPC_ADDR"); v != "" {
		cfg.GRPCAddr = v
	} else if v := viper.GetString("server.grpc.addr"); v != "" {
		cfg.GRPCAddr = v
	}
	if v := os.Getenv("PE_SERVER_JWT_SECRET"); v != "" {
		cfg.JWTSecret = v
	} else if v := viper.GetString("server.jwt-secret"); v != "" {
		cfg.JWTSecret = v
	}
	if v := os.Getenv("PE_SERVER_CORS_ORIGIN"); v != "" {
		cfg.CORSOrigin = v
	} else if v := viper.GetString("server.cors-origin"); v != "" {
		cfg.CORSOrigin = v
	}
	if v := viper.GetString("database.postgres.host"); v != "" {
		cfg.DatabaseHost = v
	}
	if v := viper.GetInt("database.postgres.port"); v != 0 {
		cfg.DatabasePort = v
	}
	if v := viper.GetString("database.postgres.database"); v != "" {
		cfg.DatabaseName = v
	}
	if v := viper.GetString("database.postgres.username"); v != "" {
		cfg.DatabaseUser = v
	}
	if v := viper.GetString("database.postgres.password"); v != "" {
		cfg.DatabasePass = v
	}
	if v := viper.GetString("database.postgres.sslmode"); v != "" {
		cfg.DatabaseSSLMode = v
	}
	return cfg
}

func setupLogger() {
	level := viper.GetString("log-level")
	format := viper.GetString("log-format")
	lvl, _ := zerolog.ParseLevel(level)
	if lvl == zerolog.NoLevel {
		lvl = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(lvl)
	if format == "json" {
		log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	} else {
		log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}).With().Timestamp().Logger()
	}
}
