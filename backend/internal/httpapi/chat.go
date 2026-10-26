package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/GautierP/web/backend/internal/inference"
	"github.com/GautierP/web/backend/internal/middleware"
	"github.com/GautierP/web/backend/internal/models"
)

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	MaxTokens   *int          `json:"max_tokens"`
	Temperature *float64      `json:"temperature"`
}

func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	if !s.limiter.Allow(middleware.ClientIP(r), time.Now()) {
		writeAPIError(w, http.StatusTooManyRequests, "rate_limited", "Too many requests. Try again in a moment.")
		return
	}
	body := http.MaxBytesReader(w, r.Body, s.cfg.RequestBodyLimit)
	var payload chatRequest
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&payload); err != nil {
		status := http.StatusBadRequest
		message := "Invalid JSON request."
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			status = http.StatusRequestEntityTooLarge
			message = "Request body too large."
		}
		writeAPIError(w, status, "invalid_request", message)
		return
	}

	model, ok := models.Get(payload.Model)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "unknown_model", "Unknown model.")
		return
	}
	if err := s.validateMessages(payload.Messages, model); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_messages", err.Error())
		return
	}

	request := inference.Request{
		Model:       model.ID,
		Messages:    toInferenceMessages(payload.Messages),
		MaxTokens:   clampInt(payload.MaxTokens, 1, s.cfg.MaxTokens),
		Temperature: clampFloat(payload.Temperature, 0, 2),
	}

	ctx, cancel := context.WithTimeout(r.Context(), s.cfg.RequestTimeout)
	defer cancel()

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher, canFlush := w.(http.Flusher)
	if !canFlush {
		s.logger.Error("response writer does not support flushing")
		return
	}

	sse := &sseWriter{writer: w, flusher: flusher}
	requestID := newRequestID()
	if err := sse.emit("start", map[string]string{"requestId": requestID}); err != nil {
		return
	}

	streamErr := s.provider.Stream(ctx, request, func(text string) error {
		return sse.emit("delta", map[string]string{"text": text})
	})

	switch {
	case streamErr == nil:
		_ = sse.emit("done", map[string]string{"finishReason": "stop"})
	case errors.Is(streamErr, inference.ErrNotConfigured):
		_ = sse.emit("error", map[string]string{
			"code":    "not_configured",
			"message": "No inference backend is configured for this model.",
		})
	case isCancellation(streamErr):
		s.logger.Info("generation canceled", "requestId", requestID, "model", model.ID)
	default:
		s.logger.Error("generation failed", "requestId", requestID, "model", model.ID, "error", streamErr)
		_ = sse.emit("error", map[string]string{
			"code":    "generation_failed",
			"message": "Generation failed. Try again later.",
		})
	}
}

func (s *Server) validateMessages(messages []chatMessage, model models.Model) error {
	switch {
	case len(messages) == 0:
		return errors.New("messages cannot be empty")
	case len(messages) > s.cfg.MaxMessages:
		return errors.New("too many messages in history")
	}
	total := 0
	for _, message := range messages {
		runes := []rune(message.Content)
		switch {
		case message.Role != "user" && message.Role != "assistant":
			return errors.New("invalid role")
		case len(runes) == 0:
			return errors.New("empty message")
		case len(runes) > s.cfg.MaxMessageLen:
			return errors.New("message too long")
		}
		total += len(runes)
	}
	if total > model.MaxContextChars() {
		return errors.New("history exceeds the model context")
	}
	return nil
}

func toInferenceMessages(messages []chatMessage) []inference.Message {
	result := make([]inference.Message, 0, len(messages))
	for _, message := range messages {
		result = append(result, inference.Message{Role: message.Role, Content: message.Content})
	}
	return result
}

func clampInt(value *int, min, max int) int {
	switch {
	case value == nil:
		return max
	case *value < min:
		return min
	case *value > max:
		return max
	default:
		return *value
	}
}

func clampFloat(value *float64, min, max float64) float64 {
	switch {
	case value == nil:
		return 1
	case *value < min:
		return min
	case *value > max:
		return max
	default:
		return *value
	}
}

func isCancellation(err error) bool {
	return errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded)
}

func newRequestID() string {
	raw := make([]byte, 8)
	_, _ = rand.Read(raw)
	return hex.EncodeToString(raw)
}
