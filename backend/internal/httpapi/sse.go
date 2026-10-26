package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type sseWriter struct {
	writer  http.ResponseWriter
	flusher http.Flusher
}

func (s *sseWriter) emit(event string, data any) error {
	encoded, err := json.Marshal(data)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(s.writer, "event: %s\ndata: %s\n\n", event, encoded)
	if err != nil {
		return err
	}
	s.flusher.Flush()
	return nil
}
