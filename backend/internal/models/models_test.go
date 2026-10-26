package models

import "testing"

func TestGet(t *testing.T) {
	model, ok := Get("minillm-70m")
	if !ok {
		t.Fatal("minillm-70m not found")
	}
	if model.Name != "MiniLLM-70M" || model.Parameters != "70M" || model.ContextTokens != 512 {
		t.Fatalf("model = %+v", model)
	}
	if _, ok := Get("minillm-1000m"); ok {
		t.Fatal("unknown model resolved")
	}
}

func TestMaxContextChars(t *testing.T) {
	if got, want := (Model{ContextTokens: 1024}).MaxContextChars(), 4096; got != want {
		t.Fatalf("MaxContextChars = %d, want %d", got, want)
	}
}
