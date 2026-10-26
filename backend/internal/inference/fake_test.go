package inference

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

func collect(t *testing.T, stream func(context.Context, Request, func(string) error) error) []string {
	t.Helper()
	var tokens []string
	err := stream(context.Background(), Request{Model: "minillm-40m", Messages: []Message{{Role: "user", Content: "salut"}}}, func(text string) error {
		tokens = append(tokens, text)
		return nil
	})
	if err != nil {
		t.Fatalf("stream error: %v", err)
	}
	return tokens
}

func TestFakeStreamsTokens(t *testing.T) {
	tokens := collect(t, Fake{Delay: time.Millisecond}.Stream)
	if len(tokens) == 0 {
		t.Fatal("no tokens emitted")
	}
}

func TestFakeStreamContentIncludesModel(t *testing.T) {
	tokens := collect(t, Fake{Delay: time.Millisecond}.Stream)
	joined := strings.Join(tokens, "")
	if !strings.Contains(joined, "minillm-40m") {
		t.Fatalf("model id missing from output: %q", joined)
	}
}

func TestFakeIncludesTruncatedUserMessage(t *testing.T) {
	tokens := collect(t, Fake{Delay: time.Millisecond}.Stream)
	joined := strings.Join(tokens, "")
	if !strings.Contains(joined, "salut") {
		t.Fatalf("user message missing from output: %q", joined)
	}
}

func TestFakeHonorsCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := Fake{Delay: 50 * time.Millisecond}.Stream(ctx, Request{Model: "x", Messages: []Message{{Role: "user", Content: "a"}}}, func(string) error {
		t.Fatal("emit called after cancellation")
		return nil
	})
	if err == nil {
		t.Fatal("expected cancellation error")
	}
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("err = %v, want context.Canceled", err)
	}
}

func TestFakeRespectsEmitError(t *testing.T) {
	emitErr := errors.New("client gone")
	err := Fake{Delay: time.Millisecond}.Stream(context.Background(), Request{Model: "x", Messages: []Message{{Role: "user", Content: "a"}}}, func(string) error {
		return emitErr
	})
	if !errors.Is(err, emitErr) {
		t.Fatalf("err = %v, want emit error", err)
	}
}

func TestUnconfiguredReturnsSentinel(t *testing.T) {
	err := Unconfigured{}.Stream(context.Background(), Request{}, func(string) error { return nil })
	if !errors.Is(err, ErrNotConfigured) {
		t.Fatalf("err = %v, want ErrNotConfigured", err)
	}
}
