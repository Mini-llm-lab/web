package inference

import (
	"context"
	"errors"
	"time"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Request struct {
	Model       string
	Messages    []Message
	MaxTokens   int
	Temperature float64
}

type Provider interface {
	Name() string
	Stream(ctx context.Context, req Request, emit func(text string) error) error
}

var ErrNotConfigured = errors.New("inference provider is not configured")

type Unconfigured struct{}

func (Unconfigured) Name() string { return "unconfigured" }

func (Unconfigured) Stream(context.Context, Request, func(string) error) error {
	return ErrNotConfigured
}

type Fake struct {
	Delay time.Duration
}

func (f Fake) Name() string { return "fake" }

func (f Fake) Stream(ctx context.Context, req Request, emit func(text string) error) error {
	delay := f.Delay
	if delay <= 0 {
		delay = 25 * time.Millisecond
	}
	tokens := []string{
		"Model preview " + req.Model + ": ",
		"this text is produced by the test provider, not by a real model.\n\n",
		"Generation is streamed token by token to validate the SSE streaming pipeline ",
		"(deltas, progressive rendering and cancellation). ",
		"Your message: " + truncate(req.Messages[len(req.Messages)-1].Content, 120) + "\n\n",
		"The real inference engine is not wired up yet.",
	}
	for _, token := range tokens {
		select {
		case <-ctx.Done():
			return context.Cause(ctx)
		case <-time.After(delay):
		}
		if err := emit(token); err != nil {
			return err
		}
	}
	return nil
}

func truncate(text string, limit int) string {
	runes := []rune(text)
	if len(runes) > limit {
		return string(runes[:limit]) + "…"
	}
	return text
}
