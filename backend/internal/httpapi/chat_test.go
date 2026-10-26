package httpapi

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/GautierP/web/backend/internal/config"
	"github.com/GautierP/web/backend/internal/inference"
	"github.com/GautierP/web/backend/internal/models"
)

type stubProvider struct {
	name     string
	tokens   []string
	err      error
	errAfter int
}

func (p *stubProvider) Name() string {
	if p.name == "" {
		return "stub"
	}
	return p.name
}

func (p *stubProvider) Stream(ctx context.Context, _ inference.Request, emit func(string) error) error {
	for i, token := range p.tokens {
		select {
		case <-ctx.Done():
			return context.Cause(ctx)
		default:
		}
		if err := emit(token); err != nil {
			return err
		}
		if p.errAfter > 0 && i+1 >= p.errAfter {
			return p.err
		}
	}
	return p.err
}

type blockingProvider struct{}

func (blockingProvider) Name() string { return "blocking" }

func (blockingProvider) Stream(ctx context.Context, _ inference.Request, _ func(string) error) error {
	<-ctx.Done()
	return context.Cause(ctx)
}

func testConfig() config.Config {
	return config.Config{
		Port:              "0",
		AllowedOrigins:    []string{"http://localhost:5173", "https://app.example.com"},
		RequestBodyLimit:  1 << 20,
		MaxMessages:       10,
		MaxMessageLen:     200,
		MaxTokens:         64,
		RequestTimeout:    5 * time.Second,
		MessageBucketSize: 1000,
		MessageRefillRate: 10,
	}
}

func newTestServer(t *testing.T, provider inference.Provider) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(New(testConfig(), provider, nil).Handler())
	t.Cleanup(server.Close)
	return server
}

func chatPayload(t *testing.T, body string) *http.Request {
	t.Helper()
	req, err := http.NewRequest(http.MethodPost, "/api/chat", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	return req
}

func validPayload(model string) string {
	return `{"model":"` + model + `","messages":[{"role":"user","content":"Bonjour"}]}`
}

type sseEvent struct {
	name string
	data string
}

func readSSEEvents(body io.Reader, limit int) ([]sseEvent, error) {
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	var events []sseEvent
	for len(events) < limit && scanner.Scan() {
		line := scanner.Text()
		if name, found := strings.CutPrefix(line, "event: "); found {
			scanner.Scan()
			dataLine := scanner.Text()
			data, _ := strings.CutPrefix(dataLine, "data: ")
			events = append(events, sseEvent{name: name, data: data})
		}
	}
	if err := scanner.Err(); err != nil {
		return events, err
	}
	return events, nil
}

func TestGetHealth(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	resp, err := http.Get(server.URL + "/api/health")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d", resp.StatusCode)
	}
	var payload struct {
		Status string `json:"status"`
	}
	if err := jsonDecode(resp.Body, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Status != "ok" {
		t.Fatalf("status field = %q", payload.Status)
	}
}

func TestGetModels(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	resp, err := http.Get(server.URL + "/api/models")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d", resp.StatusCode)
	}
	var payload struct {
		Models []struct {
			ID            string `json:"id"`
			Name          string `json:"name"`
			ContextTokens int    `json:"contextTokens"`
			Available     bool   `json:"available"`
		} `json:"models"`
	}
	if err := jsonDecode(resp.Body, &payload); err != nil {
		t.Fatal(err)
	}
	if len(payload.Models) != len(models.Registry) {
		t.Fatalf("models length = %d, want %d", len(payload.Models), len(models.Registry))
	}
	for i, model := range payload.Models {
		if model.ID != models.Registry[i].ID {
			t.Fatalf("model[%d].ID = %q", i, model.ID)
		}
		if model.Name != models.Registry[i].Name {
			t.Fatalf("model[%d].Name = %q", i, model.Name)
		}
		if model.ContextTokens != models.Registry[i].ContextTokens {
			t.Fatalf("model[%d].ContextTokens = %d", i, model.ContextTokens)
		}
		if !model.Available {
			t.Fatalf("model[%d].Available = false", i)
		}
	}
}

func TestChatStreamsSSE(t *testing.T) {
	provider := &stubProvider{tokens: []string{"Bonjour", " ", "le", " monde", " !"}}
	server := newTestServer(t, provider)

	resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(validPayload("minillm-40m")))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/event-stream") {
		t.Fatalf("Content-Type = %q", ct)
	}

	events, err := readSSEEvents(resp.Body, 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 7 {
		t.Fatalf("events count = %d, want 7 (%v)", len(events), events)
	}
	if events[0].name != "start" {
		t.Fatalf("first event = %q", events[0].name)
	}
	if !strings.HasPrefix(events[0].data, `{"requestId":"`) {
		t.Fatalf("start data = %q", events[0].data)
	}
	var deltas []string
	for _, event := range events[1:6] {
		if event.name != "delta" {
			t.Fatalf("unexpected event %q, want delta", event.name)
		}
		deltas = append(deltas, extractStringField(t, event.data, "text"))
	}
	if got, want := strings.Join(deltas, ""), "Bonjour le monde !"; got != want {
		t.Fatalf("deltas joined = %q, want %q", got, want)
	}
	if events[6].name != "done" {
		t.Fatalf("last event = %q", events[6].name)
	}
	if got := extractStringField(t, events[6].data, "finishReason"); got != "stop" {
		t.Fatalf("finishReason = %q", got)
	}
}

func TestChatNotConfiguredEmitsError(t *testing.T) {
	server := newTestServer(t, inference.Unconfigured{})
	resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(validPayload("minillm-40m")))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	events, err := readSSEEvents(resp.Body, 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 2 || events[0].name != "start" || events[1].name != "error" {
		t.Fatalf("events = %v", events)
	}
	if got := extractStringField(t, events[1].data, "code"); got != "not_configured" {
		t.Fatalf("code = %q", got)
	}
}

func TestChatMidStreamErrorIsSanitized(t *testing.T) {
	provider := &stubProvider{
		tokens:   []string{"partiel"},
		err:      errors.New("runpod endpoint https://secret.host: token abc123 invalid"),
		errAfter: 1,
	}
	server := newTestServer(t, provider)
	resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(validPayload("minillm-40m")))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	stream := string(raw)
	if strings.Contains(stream, "secret.host") || strings.Contains(stream, "abc123") {
		t.Fatalf("internal error details leaked into SSE stream: %q", stream)
	}
	if !strings.Contains(stream, "event: delta") {
		t.Fatal("partial delta lost")
	}
	if !strings.Contains(stream, "event: error") {
		t.Fatalf("no error event in stream: %q", stream)
	}
	if strings.Contains(stream, "event: done") {
		t.Fatal("done emitted after failure")
	}
}

func TestChatMissingModel(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	cases := []string{
		`{"model":"gpt-4","messages":[{"role":"user","content":"salut"}]}`,
		`{"messages":[{"role":"user","content":"salut"}]}`,
	}
	for _, payload := range cases {
		resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(payload))
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("payload %q: status = %d", payload, resp.StatusCode)
		}
		resp.Body.Close()
	}
}

func TestChatValidation(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	cases := map[string]string{
		"empty body":        "",
		"malformed json":    "{not json",
		"unknown field":     `{"model":"minillm-40m","messages":[{"role":"user","content":"a"}],"foo":"bar"}`,
		"empty messages":    `{"model":"minillm-40m","messages":[]}`,
		"invalid role":      `{"model":"minillm-40m","messages":[{"role":"system","content":"pirate"}]}`,
		"empty content":     `{"model":"minillm-40m","messages":[{"role":"user","content":""}]}`,
		"message too long":  `{"model":"minillm-40m","messages":[{"role":"user","content":"` + strings.Repeat("a", 201) + `"}]}`,
		"too many messages": messagesOverflow(),
	}
	for name, payload := range cases {
		resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(payload))
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("%s: status = %d", name, resp.StatusCode)
		}
		resp.Body.Close()
	}
}

func TestChatContextOverflowRejected(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	long := strings.Repeat("a", 5000)
	payload := `{"model":"minillm-70m","messages":[{"role":"user","content":"` + long + `"}]}`
	resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(payload))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d", resp.StatusCode)
	}
}

func TestChatBodyTooLarge(t *testing.T) {
	cfg := testConfig()
	cfg.RequestBodyLimit = 10
	server := httptest.NewServer(New(cfg, &stubProvider{}, nil).Handler())
	defer server.Close()

	resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(validPayload(strings.Repeat("minillm-40m", 100))))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d", resp.StatusCode)
	}
}

func TestChatRateLimited(t *testing.T) {
	cfg := testConfig()
	cfg.MessageBucketSize = 1
	cfg.MessageRefillRate = 0.0001
	server := httptest.NewServer(New(cfg, &stubProvider{}, nil).Handler())
	defer server.Close()

	send := func() int {
		resp, err := http.Post(server.URL+"/api/chat", "application/json", strings.NewReader(validPayload("minillm-40m")))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		return resp.StatusCode
	}
	if code := send(); code != http.StatusOK {
		t.Fatalf("first request status = %d", code)
	}
	if code := send(); code != http.StatusTooManyRequests {
		t.Fatalf("second request status = %d", code)
	}
}

func TestChatClientDisconnectCancels(t *testing.T) {
	server := newTestServer(t, blockingProvider{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, server.URL+"/api/chat", strings.NewReader(validPayload("minillm-40m")))
	if err != nil {
		t.Fatal(err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	_, readErr := readSSEEvents(resp.Body, 1)
	if readErr != nil {
		t.Fatal(readErr)
	}

	cancel()

	healthCtx, healthCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer healthCancel()
	healthReq, err := http.NewRequestWithContext(healthCtx, http.MethodGet, server.URL+"/api/health", nil)
	if err != nil {
		t.Fatal(err)
	}
	healthResp, err := http.DefaultClient.Do(healthReq)
	if err != nil {
		t.Fatalf("server unresponsive after cancellation: %v", err)
	}
	healthResp.Body.Close()
	if healthResp.StatusCode != http.StatusOK {
		t.Fatalf("health after cancellation status = %d", healthResp.StatusCode)
	}
}

func TestCORSPreflight(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	req, _ := http.NewRequest(http.MethodOptions, server.URL+"/api/chat", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", "POST")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d", resp.StatusCode)
	}
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("ACAO = %q", got)
	}
}

func TestCORSDisallowedOrigin(t *testing.T) {
	server := newTestServer(t, &stubProvider{})
	req, _ := http.NewRequest(http.MethodGet, server.URL+"/api/models", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("ACAO = %q, want empty", got)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d (request should still succeed without CORS headers)", resp.StatusCode)
	}
}

func messagesOverflow() string {
	return `{"model":"minillm-40m","messages":[` + strings.Repeat(`{"role":"user","content":"a"},`, 11) + `{"role":"user","content":"b"}]}`
}

func jsonDecode(r io.Reader, v any) error {
	return json.NewDecoder(r).Decode(v)
}

func extractStringField(t *testing.T, jsonLine, field string) string {
	t.Helper()
	var m map[string]any
	if err := jsonDecode(bytes.NewReader([]byte(jsonLine)), &m); err != nil {
		t.Fatal(err)
	}
	value, _ := m[field].(string)
	return value
}
