package erroritem

import (
	"errors"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/repository"
)

type Service struct {
	store *repository.MemoryStore
}

type ConfirmInput struct {
	UserID             string   `json:"userId"`
	ProvinceID         string   `json:"provinceId"`
	AISuggestedGradeID string   `json:"aiSuggestedGradeId"`
	ConfirmedGradeID   string   `json:"confirmedGradeId"`
	AISuggestedSubject string   `json:"aiSuggestedSubject"`
	ConfirmedSubject   string   `json:"confirmedSubject"`
	QuestionText       string   `json:"questionText"`
	CorrectAnswer      string   `json:"correctAnswer"`
	Analysis           string   `json:"analysis"`
	KnowledgePointIDs  []string `json:"knowledgePointIds"`
}

func NewService(store *repository.MemoryStore) *Service {
	return &Service{store: store}
}

func (s *Service) Confirm(input ConfirmInput) (model.ErrorItem, error) {
	if input.UserID == "" || input.QuestionText == "" || input.ConfirmedGradeID == "" || input.ConfirmedSubject == "" {
		return model.ErrorItem{}, errors.New("user, question, confirmed grade and confirmed subject are required")
	}
	nb := s.store.EnsureDefaultNotebook(input.UserID)
	item := model.ErrorItem{
		UserID:             input.UserID,
		NotebookID:         nb.ID,
		ProvinceID:         input.ProvinceID,
		AISuggestedGradeID: input.AISuggestedGradeID,
		ConfirmedGradeID:   input.ConfirmedGradeID,
		AISuggestedSubject: input.AISuggestedSubject,
		ConfirmedSubject:   input.ConfirmedSubject,
		QuestionText:       input.QuestionText,
		CorrectAnswer:      input.CorrectAnswer,
		Analysis:           input.Analysis,
		KnowledgePointIDs:  input.KnowledgePointIDs,
		Status:             model.StatusReviewing,
	}
	return s.store.CreateErrorItem(item), nil
}

func (s *Service) List(userID string) []model.ErrorItem {
	return s.store.ErrorItemsByUser(userID)
}
