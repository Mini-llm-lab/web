package config

import (
	"testing"
	"time"
)

func TestDefaults(t *testing.T) {
	cfg := FromEnv()
	if cfg.Port != DefaultPort {
		t.Fatalf("Port = %q, want %q", cfg.Port, DefaultPort)
	}
	if len(cfg.AllowedOrigins) != 1 || cfg.AllowedOrigins[0] != DefaultCORSOrigins {
		t.Fatalf("AllowedOrigins = %v", cfg.AllowedOrigins)
	}
	if cfg.RequestBodyLimit != DefaultMaxBodyBytes {
		t.Fatalf("RequestBodyLimit = %d", cfg.RequestBodyLimit)
	}
	if cfg.RequestTimeout != DefaultTimeout {
		t.Fatalf("RequestTimeout = %v", cfg.RequestTimeout)
	}
}

func TestFromEnvOverrides(t *testing.T) {
	t.Setenv("PORT", "9000")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://a.example, https://b.example/")
	t.Setenv("MAX_TOKENS", "256")
	t.Setenv("REQUEST_TIMEOUT_SECONDS", "30")

	cfg := FromEnv()
	if cfg.Port != "9000" {
		t.Fatalf("Port = %q", cfg.Port)
	}
	wantOrigins := []string{"https://a.example", "https://b.example"}
	for i, want := range wantOrigins {
		if cfg.AllowedOrigins[i] != want {
			t.Fatalf("AllowedOrigins[%d] = %q, want %q", i, cfg.AllowedOrigins[i], want)
		}
	}
	if cfg.MaxTokens != 256 {
		t.Fatalf("MaxTokens = %d", cfg.MaxTokens)
	}
	if cfg.RequestTimeout != 30*time.Second {
		t.Fatalf("RequestTimeout = %v", cfg.RequestTimeout)
	}
}

func TestInvalidValuesFallBack(t *testing.T) {
	t.Setenv("MAX_TOKENS", "-5")
	t.Setenv("REQUEST_TIMEOUT_SECONDS", "not-a-number")
	cfg := FromEnv()
	if cfg.MaxTokens != DefaultMaxTokens {
		t.Fatalf("MaxTokens = %d", cfg.MaxTokens)
	}
	if cfg.RequestTimeout != DefaultTimeout {
		t.Fatalf("RequestTimeout = %v", cfg.RequestTimeout)
	}
}
