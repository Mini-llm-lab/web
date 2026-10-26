package middleware

import (
	"log/slog"
	"net/http"
)

type writtenResponseWriter struct {
	http.ResponseWriter
	wroteHeader bool
}

func (w *writtenResponseWriter) WriteHeader(status int) {
	w.wroteHeader = true
	w.ResponseWriter.WriteHeader(status)
}

func (w *writtenResponseWriter) Write(p []byte) (int, error) {
	w.wroteHeader = true
	return w.ResponseWriter.Write(p)
}

func (w *writtenResponseWriter) Flush() {
	w.wroteHeader = true
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

func Recovery(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tracked := &writtenResponseWriter{ResponseWriter: w}
			defer func() {
				if rec := recover(); rec != nil {
					logger.Error("panic recovered", "path", r.URL.Path, "panic", rec)
					if !tracked.wroteHeader {
						w.Header().Set("Content-Type", "application/json; charset=utf-8")
						w.WriteHeader(http.StatusInternalServerError)
						_, _ = w.Write([]byte(`{"error":{"code":"internal_error","message":"Internal server error."}}`))
					}
				}
			}()
			next.ServeHTTP(tracked, r)
		})
	}
}
