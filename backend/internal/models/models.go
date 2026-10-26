package models

type Model struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Parameters    string `json:"parameters"`
	ContextTokens int    `json:"contextTokens"`
}

var Registry = []Model{
	{ID: "minillm-40m", Name: "MiniLLM-40M", Parameters: "40M", ContextTokens: 1024},
	{ID: "minillm-70m", Name: "MiniLLM-70M", Parameters: "70M", ContextTokens: 512},
	{ID: "minillm-150m", Name: "MiniLLM-150M", Parameters: "150M", ContextTokens: 512},
}

func Get(id string) (Model, bool) {
	for _, model := range Registry {
		if model.ID == id {
			return model, true
		}
	}
	return Model{}, false
}

const CharsPerToken = 4

func (m Model) MaxContextChars() int {
	return m.ContextTokens * CharsPerToken
}
