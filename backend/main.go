package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/GautierP/web/backend/internal/config"
	"github.com/GautierP/web/backend/internal/httpapi"
	"github.com/GautierP/web/backend/internal/inference"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	cfg := config.FromEnv()

	provider := selectProvider(cfg, logger)
	api := httpapi.New(cfg, provider, logger)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       2 * time.Minute,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("server started", "addr", server.Addr, "provider", provider.Name())
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
	}
	logger.Info("server stopped")
}

func selectProvider(cfg config.Config, logger *slog.Logger) inference.Provider {
	if cfg.Provider == "fake" {
		return inference.Fake{Delay: 25 * time.Millisecond}
	}
	if cfg.Provider != "" && cfg.Provider != "runpod" {
		logger.Warn("unknown INFERENCE_PROVIDER, falling back to unconfigured", "value", cfg.Provider)
	}
	return inference.Unconfigured{}
}
