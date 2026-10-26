package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/GautierP/web/backend/internal/config"
	"github.com/GautierP/web/backend/internal/inference"
	"github.com/GautierP/web/backend/internal/middleware"
	"github.com/GautierP/web/backend/internal/models"
)

type Server struct {
	cfg      config.Config
	provider inference.Provider
	limiter  *middleware.Limiter
	mux      *http.ServeMux
	logger   *slog.Logger
}

func New(cfg config.Config, provider inference.Provider, logger *slog.Logger) *Server {
	if logger == nil {
		logger = slog.Default()
	}
	s := &Server{
		cfg:      cfg,
		provider: provider,
		limiter:  middleware.NewLimiter(cfg.MessageBucketSize, cfg.MessageRefillRate),
		mux:      http.NewServeMux(),
		logger:   logger,
	}
	s.mux.HandleFunc("GET /api/health", s.handleHealth)
	s.mux.HandleFunc("GET /api/models", s.handleModels)
	s.mux.HandleFunc("POST /api/chat", s.handleChat)
	return s
}

func (s *Server) Handler() http.Handler {
	cors := middleware.CORS{AllowedOrigins: s.cfg.AllowedOrigins}
	recovery := middleware.Recovery(s.logger)
	return recovery(cors.Middleware(s.mux))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleModels(w http.ResponseWriter, r *http.Request) {
	type entry struct {
		ID            string `json:"id"`
		Name          string `json:"name"`
		Parameters    string `json:"parameters"`
		ContextTokens int    `json:"contextTokens"`
		Available     bool   `json:"available"`
	}
	list := make([]entry, 0, len(models.Registry))
	for i := range models.Registry {
		m := models.Registry[i]
		list = append(list, entry{
			ID:            m.ID,
			Name:          m.Name,
			Parameters:    m.Parameters,
			ContextTokens: m.ContextTokens,
			Available:     true,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"models": list})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeAPIError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]apiError{"error": {Code: code, Message: message}})
}
