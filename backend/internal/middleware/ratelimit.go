package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

type bucket struct {
	tokens  float64
	lastUse time.Time
}

type Limiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	max     float64
	rate    float64
}

func NewLimiter(max, rate float64) *Limiter {
	return &Limiter{buckets: map[string]*bucket{}, max: max, rate: rate}
}

func (l *Limiter) Allow(key string, now time.Time) bool {
	if l.max <= 0 {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	if b, ok := l.buckets[key]; ok {
		elapsed := now.Sub(b.lastUse).Seconds()
		b.tokens = min(l.max, b.tokens+elapsed*l.rate)
		b.lastUse = now
		if b.tokens < 1 {
			return false
		}
		b.tokens--
		return true
	}
	l.buckets[key] = &bucket{tokens: l.max - 1, lastUse: now}
	if len(l.buckets) > 10_000 {
		for key, b := range l.buckets {
			if now.Sub(b.lastUse) > time.Hour {
				delete(l.buckets, key)
			}
		}
	}
	return true
}

func ClientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
