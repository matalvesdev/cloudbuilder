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
	Use:   "provision-engine-scheduler",
	Short: "CloudBuilder Provision Engine Scheduler",
	RunE:  runScheduler,
}

func init() {
	rootCmd.PersistentFlags().String("config", "configs/config.yaml", "config file path")
	_ = viper.BindPFlag("config", rootCmd.PersistentFlags().Lookup("config"))
}

func runScheduler(cmd *cobra.Command, args []string) error {
	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("read config: %w", err)
	}

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// TODO: Initialize scheduler, Redis queue, leader election
	// Scheduler polls for due jobs and enqueues to Redis

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("scheduler shutting down")
	return nil
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
