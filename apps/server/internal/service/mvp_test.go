package service_test

import (
	"strings"
	"testing"
	"time"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/repository"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/erroritem"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/grading"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/review"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/user"
)

func TestUserLoginCreatesThirtyDaySessionAndDefaultNotebook(t *testing.T) {
	store := repository.NewMemoryStore()
	now := time.Date(2026, 6, 10, 9, 0, 0, 0, time.UTC)
	service := user.NewService(store, func() time.Time { return now })

	result, err := service.LoginWithWeChat(user.WeChatLoginInput{
		OpenID:   "openid-1",
		Phone:    "13800138000",
		Nickname: "Ada",
		Province: "guangdong",
		Grade:    "grade-8",
	})
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	if result.Session.ExpiresAt.Sub(now) != 30*24*time.Hour {
		t.Fatalf("session should last 30 days, got %s", result.Session.ExpiresAt.Sub(now))
	}
	notebooks := store.NotebooksByUser(result.User.ID)
	if len(notebooks) != 1 || !notebooks[0].IsDefault {
		t.Fatalf("expected one default notebook, got %#v", notebooks)
	}
}

func TestConfirmErrorItemUsesConfirmedGradeAndDefaultNotebook(t *testing.T) {
	store := repository.NewMemoryStore()
	u := store.CreateUser(model.User{ProvinceID: "guangdong", GradeID: "grade-8"})
	nb := store.EnsureDefaultNotebook(u.ID)
	service := erroritem.NewService(store)

	item, err := service.Confirm(erroritem.ConfirmInput{
		UserID:             u.ID,
		ProvinceID:         u.ProvinceID,
		AISuggestedGradeID: "grade-8",
		ConfirmedGradeID:   "grade-9",
		AISuggestedSubject: "math",
		ConfirmedSubject:   "math",
		QuestionText:       "Solve y = 2x + 1 when x = 3.",
		CorrectAnswer:      "7",
		Analysis:           "Substitute x = 3.",
		KnowledgePointIDs:  []string{"kp-linear-function"},
	})
	if err != nil {
		t.Fatalf("confirm failed: %v", err)
	}

	if item.NotebookID != nb.ID {
		t.Fatalf("expected default notebook %q, got %q", nb.ID, item.NotebookID)
	}
	if item.ConfirmedGradeID != "grade-9" {
		t.Fatalf("expected confirmed grade to win, got %q", item.ConfirmedGradeID)
	}
}

func TestGradingCreatesAnswerRecordAndKnowledgeDiagnosis(t *testing.T) {
	store := repository.NewMemoryStore()
	u := store.CreateUser(model.User{ProvinceID: "guangdong", GradeID: "grade-8"})
	item := store.CreateErrorItem(model.ErrorItem{
		UserID:            u.ID,
		ConfirmedSubject:  "math",
		ConfirmedGradeID:  "grade-8",
		QuestionText:      "2 + 3 = ?",
		CorrectAnswer:     "5",
		KnowledgePointIDs: []string{"kp-addition"},
	})
	service := grading.NewService(store)

	result, err := service.Grade(grading.GradeInput{
		UserID:      u.ID,
		ErrorItemID: item.ID,
		AnswerText:  "4",
	})
	if err != nil {
		t.Fatalf("grade failed: %v", err)
	}

	if result.Answer.GradeResult != model.GradeWrong {
		t.Fatalf("expected wrong grade, got %q", result.Answer.GradeResult)
	}
	if len(result.Diagnoses) != 1 {
		t.Fatalf("expected one diagnosis, got %#v", result.Diagnoses)
	}
	if result.Diagnoses[0].KnowledgePointID != "kp-addition" {
		t.Fatalf("expected diagnosis on kp-addition, got %q", result.Diagnoses[0].KnowledgePointID)
	}
	if !strings.Contains(result.Diagnoses[0].AIExplanation, "5") {
		t.Fatalf("expected explanation to mention correct answer, got %q", result.Diagnoses[0].AIExplanation)
	}
}

func TestReviewMarksItemMasteredAfterTwoCorrectAnswers(t *testing.T) {
	store := repository.NewMemoryStore()
	u := store.CreateUser(model.User{ProvinceID: "guangdong", GradeID: "grade-8"})
	item := store.CreateErrorItem(model.ErrorItem{
		UserID:           u.ID,
		Status:           model.StatusReviewing,
		ConfirmedSubject: "math",
		ConfirmedGradeID: "grade-8",
		QuestionText:     "2 + 3 = ?",
		CorrectAnswer:    "5",
	})
	grader := grading.NewService(store)
	reviewer := review.NewService(store, grader)

	for range 2 {
		if _, err := reviewer.AnswerDailyQuestion(review.AnswerInput{
			UserID:      u.ID,
			ErrorItemID: item.ID,
			AnswerText:  "5",
		}); err != nil {
			t.Fatalf("answer failed: %v", err)
		}
	}

	updated, ok := store.ErrorItem(item.ID)
	if !ok {
		t.Fatal("item disappeared")
	}
	if updated.Status != model.StatusMastered {
		t.Fatalf("expected mastered item, got %q", updated.Status)
	}
}
