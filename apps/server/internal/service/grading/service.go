package grading

import (
	"errors"
	"fmt"
	"strings"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/repository"
)

type Service struct {
	store *repository.MemoryStore
}

type GradeInput struct {
	UserID      string `json:"userId"`
	ErrorItemID string `json:"errorItemId"`
	AnswerText  string `json:"answerText"`
}

type Result struct {
	Answer    model.AnswerRecord                 `json:"answer"`
	Diagnoses []model.AnswerKnowledgeDiagnosis   `json:"diagnoses"`
}

func NewService(store *repository.MemoryStore) *Service {
	return &Service{store: store}
}

func (s *Service) Grade(input GradeInput) (Result, error) {
	item, ok := s.store.ErrorItem(input.ErrorItemID)
	if !ok || item.UserID != input.UserID {
		return Result{}, errors.New("error item not found")
	}
	answerText := strings.TrimSpace(input.AnswerText)
	correct := strings.EqualFold(answerText, strings.TrimSpace(item.CorrectAnswer))
	grade := model.GradeWrong
	score := 0
	reason := fmt.Sprintf("答案应为 %s，当前答案为 %s。", item.CorrectAnswer, answerText)
	if correct {
		grade = model.GradeCorrect
		score = 100
		reason = "答案正确。"
	}
	answer := s.store.CreateAnswer(model.AnswerRecord{
		UserID:      input.UserID,
		ErrorItemID: input.ErrorItemID,
		AnswerText:  answerText,
		GradeResult: grade,
		Score:       score,
		Confidence:  0.96,
		GradeReason: reason,
	})
	diagnoses := []model.AnswerKnowledgeDiagnosis{}
	if !correct {
		kp := "general"
		if len(item.KnowledgePointIDs) > 0 {
			kp = item.KnowledgePointIDs[0]
		}
		diagnoses = append(diagnoses, model.AnswerKnowledgeDiagnosis{
			KnowledgePointID: kp,
			DiagnosisType:    "concept_missing",
			Severity:         "medium",
			Evidence:         answerText,
			AIExplanation:    fmt.Sprintf("这次作答没有得到正确答案 %s，建议回看该知识点的基本概念和计算步骤。", item.CorrectAnswer),
		})
		diagnoses = s.store.CreateDiagnoses(answer.ID, diagnoses)
	}
	return Result{Answer: answer, Diagnoses: diagnoses}, nil
}
