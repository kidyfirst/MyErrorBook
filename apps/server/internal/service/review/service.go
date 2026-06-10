package review

import (
	"time"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/repository"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/grading"
)

type Service struct {
	store  *repository.MemoryStore
	grader *grading.Service
}

type AnswerInput struct {
	UserID      string `json:"userId"`
	ErrorItemID string `json:"errorItemId"`
	AnswerText  string `json:"answerText"`
}

type AnswerResult struct {
	Grading grading.Result     `json:"grading"`
	Review  model.ReviewRecord `json:"review"`
	Item    model.ErrorItem    `json:"item"`
}

func NewService(store *repository.MemoryStore, grader *grading.Service) *Service {
	return &Service{store: store, grader: grader}
}

func (s *Service) AnswerDailyQuestion(input AnswerInput) (AnswerResult, error) {
	result, err := s.grader.Grade(grading.GradeInput(input))
	if err != nil {
		return AnswerResult{}, err
	}
	item, _ := s.store.ErrorItem(input.ErrorItemID)
	isCorrect := result.Answer.GradeResult == model.GradeCorrect
	item.ReviewCount++
	item.LastReviewedAt = time.Now()
	if isCorrect {
		item.ConsecutiveCorrectCount++
		if item.ConsecutiveCorrectCount >= 2 {
			item.Status = model.StatusMastered
		}
	} else {
		item.ConsecutiveCorrectCount = 0
		item.WrongCount++
		item.Status = model.StatusReviewing
	}
	item = s.store.UpdateErrorItem(item)
	review := s.store.CreateReview(model.ReviewRecord{
		UserID:         input.UserID,
		ErrorItemID:    input.ErrorItemID,
		AnsweredAt:     time.Now(),
		AnswerRecordID: result.Answer.ID,
		IsCorrect:      isCorrect,
		NextReviewAt:   time.Now().Add(24 * time.Hour),
		ReviewStage:    item.ConsecutiveCorrectCount,
	})
	return AnswerResult{Grading: result, Review: review, Item: item}, nil
}

func (s *Service) DailyQuestion(userID string) (model.ErrorItem, bool) {
	for _, item := range s.store.ErrorItemsByUser(userID) {
		if item.Status != model.StatusMastered {
			return item, true
		}
	}
	return model.ErrorItem{}, false
}
