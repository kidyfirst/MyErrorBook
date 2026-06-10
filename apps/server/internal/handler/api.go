package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/repository"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/erroritem"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/grading"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/review"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/service/user"
)

type API struct {
	mux        *http.ServeMux
	store      *repository.MemoryStore
	users      *user.Service
	errors     *erroritem.Service
	grading    *grading.Service
	reviews    *review.Service
}

func NewAPI() *API {
	store := repository.NewMemoryStore()
	grader := grading.NewService(store)
	api := &API{
		mux:     http.NewServeMux(),
		store:   store,
		users:   user.NewService(store, time.Now),
		errors:  erroritem.NewService(store),
		grading: grader,
		reviews: review.NewService(store, grader),
	}
	api.routes()
	return api
}

func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	a.mux.ServeHTTP(w, r)
}

func (a *API) routes() {
	a.mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	a.mux.HandleFunc("GET /api/auth/wechat/oauth-url", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"url": "/login?mock=wechat"})
	})
	a.mux.HandleFunc("POST /api/auth/wechat/callback", a.handleWeChatCallback)
	a.mux.HandleFunc("GET /api/provinces", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, []map[string]string{{"id": "guangdong", "name": "广东省"}})
	})
	a.mux.HandleFunc("GET /api/grades", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, []map[string]string{
			{"id": "grade-7", "name": "初一"},
			{"id": "grade-8", "name": "初二"},
			{"id": "grade-9", "name": "初三"},
		})
	})
	a.mux.HandleFunc("POST /api/error-images", a.handleImageUpload)
	a.mux.HandleFunc("POST /api/error-items/confirm", a.handleConfirm)
	a.mux.HandleFunc("GET /api/error-items", a.handleList)
	a.mux.HandleFunc("GET /api/daily-question", a.handleDailyQuestion)
	a.mux.HandleFunc("POST /api/daily-question/answer", a.handleAnswer)
	a.mux.HandleFunc("GET /api/stats/overview", a.handleStats)
	a.mux.HandleFunc("POST /api/admin/auth/login", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"admin": map[string]string{"username": "admin"}, "sessionDays": 30})
	})
}

func (a *API) handleWeChatCallback(w http.ResponseWriter, r *http.Request) {
	var input user.WeChatLoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	result, err := a.users.LoginWithWeChat(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (a *API) handleImageUpload(w http.ResponseWriter, r *http.Request) {
	task := model.AITask{
		ID:        "task_demo",
		Status:    "recognized",
		CreatedAt: time.Now(),
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"task": task,
		"suggestion": map[string]any{
			"questionText":       "2 + 3 = ?",
			"correctAnswer":      "5",
			"analysis":           "加法基础题，计算 2 和 3 的和。",
			"aiSuggestedSubject": "math",
			"confirmedSubject":   "math",
			"aiSuggestedGradeId": "grade-8",
			"confirmedGradeId":   "grade-8",
			"provinceId":         "guangdong",
			"knowledgePointIds":  []string{"kp-addition"},
		},
	})
}

func (a *API) handleConfirm(w http.ResponseWriter, r *http.Request) {
	var input erroritem.ConfirmInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if input.UserID == "" {
		input.UserID = r.URL.Query().Get("userId")
	}
	item, err := a.errors.Confirm(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (a *API) handleList(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	writeJSON(w, http.StatusOK, a.errors.List(userID))
}

func (a *API) handleDailyQuestion(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	item, ok := a.reviews.DailyQuestion(userID)
	if !ok {
		writeJSON(w, http.StatusOK, map[string]any{"empty": true})
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (a *API) handleAnswer(w http.ResponseWriter, r *http.Request) {
	var input review.AnswerInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	result, err := a.reviews.AnswerDailyQuestion(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (a *API) handleStats(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	items := a.errors.List(userID)
	mastered := 0
	for _, item := range items {
		if item.Status == model.StatusMastered {
			mastered++
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"total":     len(items),
		"mastered":  mastered,
		"reviewing": len(items) - mastered,
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": strings.TrimSpace(msg)})
}
