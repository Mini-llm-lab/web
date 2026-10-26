package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultPort          = "8080"
	DefaultCORSOrigins   = "http://localhost:5173"
	DefaultMaxBodyBytes  = 1 << 20
	DefaultMaxMessages   = 64
	DefaultMaxMessageLen = 8000
	DefaultMaxTokens     = 512
	MaxTemperature       = 2.0
	DefaultTimeout       = 2 * time.Minute
)

type Config struct {
	Port              string
	AllowedOrigins    []string
	Provider          string
	RequestBodyLimit  int64
	MaxMessages       int
	MaxMessageLen     int
	MaxTokens         int
	RequestTimeout    time.Duration
	MessageBucketSize float64
	MessageRefillRate float64
	RunPodAPIKey      string
}

func FromEnv() Config {
	return Config{
		Port:              envOr("PORT", DefaultPort),
		AllowedOrigins:    envList("CORS_ALLOWED_ORIGINS", DefaultCORSOrigins),
		Provider:          envOr("INFERENCE_PROVIDER", ""),
		RequestBodyLimit:  envInt64("MAX_BODY_BYTES", DefaultMaxBodyBytes),
		MaxMessages:       int(envInt64("MAX_MESSAGES", DefaultMaxMessages)),
		MaxMessageLen:     int(envInt64("MAX_MESSAGE_CHARS", DefaultMaxMessageLen)),
		MaxTokens:         int(envInt64("MAX_TOKENS", DefaultMaxTokens)),
		RequestTimeout:    time.Duration(envInt64("REQUEST_TIMEOUT_SECONDS", int64((DefaultTimeout).Seconds()))) * time.Second,
		MessageBucketSize: envFloat("RATE_LIMIT_BURST", 20),
		MessageRefillRate: envFloat("RATE_LIMIT_PER_SECOND", 0.5),
		RunPodAPIKey:      os.Getenv("RUNPOD_API_KEY"),
	}
}

func envOr(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return fallback
}

func envList(key, fallback string) []string {
	value := envOr(key, fallback)
	entries := strings.Split(value, ",")
	result := make([]string, 0, len(entries))
	for _, entry := range entries {
		trimmed := strings.TrimSpace(entry)
		if trimmed != "" {
			result = append(result, strings.TrimSuffix(trimmed, "/"))
		}
	}
	return result
}

func envInt64(key string, fallback int64) int64 {
	value := envOr(key, "")
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func envFloat(key string, fallback float64) float64 {
	value := envOr(key, "")
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil || parsed < 0 {
		return fallback
	}
	return parsed
}
