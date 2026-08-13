package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var rootCmd = &cobra.Command{
	Use:   "provision-engine-worker",
	Short: "CloudBuilder Provision Engine Worker",
	RunE:  runWorker,
}

func init() {
	rootCmd.PersistentFlags().String("config", "configs/config.yaml", "config file path")
	_ = viper.BindPFlag("config", rootCmd.PersistentFlags().Lookup("config"))
}

func runWorker(cmd *cobra.Command, args []string) error {
	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("read config: %w", err)
	}

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// TODO: Initialize worker pool, plugin registry, scheduler
	// Worker reads jobs from queue, executes via plugin registry

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("worker shutting down")
	return nil
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
