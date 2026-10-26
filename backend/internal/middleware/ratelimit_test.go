package middleware

import (
	"testing"
	"time"
)

func TestLimiterAllowsBurstThenBlocks(t *testing.T) {
	now := time.Now()
	limiter := NewLimiter(2, 0.1)
	if !limiter.Allow("ip1", now) {
		t.Fatal("first request blocked")
	}
	if !limiter.Allow("ip1", now) {
		t.Fatal("second request blocked")
	}
	if limiter.Allow("ip1", now) {
		t.Fatal("third request allowed over burst")
	}
}

func TestLimiterRefills(t *testing.T) {
	now := time.Now()
	limiter := NewLimiter(1, 10)
	if !limiter.Allow("ip1", now) {
		t.Fatal("first request blocked")
	}
	if limiter.Allow("ip1", now) {
		t.Fatal("immediate second request allowed")
	}
	if !limiter.Allow("ip1", now.Add(500*time.Millisecond)) {
		t.Fatal("token not refilled after half a second")
	}
}

func TestLimiterIsolatesKeys(t *testing.T) {
	now := time.Now()
	limiter := NewLimiter(1, 0)
	if !limiter.Allow("ip1", now) {
		t.Fatal("ip1 blocked")
	}
	if !limiter.Allow("ip2", now) {
		t.Fatal("ip2 blocked by ip1 traffic")
	}
}
