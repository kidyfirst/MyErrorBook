package repository

import (
	"fmt"
	"sync"
	"time"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
)

type MemoryStore struct {
	mu          sync.Mutex
	nextID      int
	users       map[string]model.User
	sessions    map[string]model.Session
	notebooks   map[string]model.Notebook
	items       map[string]model.ErrorItem
	answers     map[string]model.AnswerRecord
	diagnoses   map[string][]model.AnswerKnowledgeDiagnosis
	reviews     map[string]model.ReviewRecord
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		users:     map[string]model.User{},
		sessions:  map[string]model.Session{},
		notebooks: map[string]model.Notebook{},
		items:     map[string]model.ErrorItem{},
		answers:   map[string]model.AnswerRecord{},
		diagnoses: map[string][]model.AnswerKnowledgeDiagnosis{},
		reviews:   map[string]model.ReviewRecord{},
	}
}

func (s *MemoryStore) id(prefix string) string {
	s.nextID++
	return fmt.Sprintf("%s_%d", prefix, s.nextID)
}

func (s *MemoryStore) CreateUser(u model.User) model.User {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	u.ID = s.id("user")
	if u.Status == "" {
		u.Status = "active"
	}
	if u.Role == "" {
		u.Role = "student"
	}
	u.CreatedAt = now
	u.UpdatedAt = now
	s.users[u.ID] = u
	return u
}

func (s *MemoryStore) FindUserByOpenID(openid string) (model.User, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, u := range s.users {
		if u.WeChatOpen == openid {
			return u, true
		}
	}
	return model.User{}, false
}

func (s *MemoryStore) EnsureDefaultNotebook(userID string) model.Notebook {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, nb := range s.notebooks {
		if nb.UserID == userID && nb.IsDefault {
			return nb
		}
	}
	now := time.Now()
	nb := model.Notebook{
		ID:        s.id("notebook"),
		UserID:    userID,
		Name:      "默认错题本",
		IsDefault: true,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.notebooks[nb.ID] = nb
	return nb
}

func (s *MemoryStore) NotebooksByUser(userID string) []model.Notebook {
	s.mu.Lock()
	defer s.mu.Unlock()
	result := []model.Notebook{}
	for _, nb := range s.notebooks {
		if nb.UserID == userID {
			result = append(result, nb)
		}
	}
	return result
}

func (s *MemoryStore) CreateSession(session model.Session) model.Session {
	s.mu.Lock()
	defer s.mu.Unlock()
	session.ID = s.id("session")
	session.CreatedAt = time.Now()
	s.sessions[session.ID] = session
	return session
}

func (s *MemoryStore) CreateErrorItem(item model.ErrorItem) model.ErrorItem {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	item.ID = s.id("error")
	if item.Status == "" {
		item.Status = model.StatusNew
	}
	item.CreatedAt = now
	item.UpdatedAt = now
	s.items[item.ID] = item
	return item
}

func (s *MemoryStore) UpdateErrorItem(item model.ErrorItem) model.ErrorItem {
	s.mu.Lock()
	defer s.mu.Unlock()
	item.UpdatedAt = time.Now()
	s.items[item.ID] = item
	return item
}

func (s *MemoryStore) ErrorItem(id string) (model.ErrorItem, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.items[id]
	return item, ok
}

func (s *MemoryStore) ErrorItemsByUser(userID string) []model.ErrorItem {
	s.mu.Lock()
	defer s.mu.Unlock()
	result := []model.ErrorItem{}
	for _, item := range s.items {
		if item.UserID == userID {
			result = append(result, item)
		}
	}
	return result
}

func (s *MemoryStore) CreateAnswer(answer model.AnswerRecord) model.AnswerRecord {
	s.mu.Lock()
	defer s.mu.Unlock()
	answer.ID = s.id("answer")
	now := time.Now()
	answer.SubmittedAt = now
	answer.CreatedAt = now
	s.answers[answer.ID] = answer
	return answer
}

func (s *MemoryStore) CreateDiagnoses(answerID string, diagnoses []model.AnswerKnowledgeDiagnosis) []model.AnswerKnowledgeDiagnosis {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for i := range diagnoses {
		diagnoses[i].ID = s.id("diagnosis")
		diagnoses[i].AnswerRecordID = answerID
		diagnoses[i].CreatedAt = now
	}
	s.diagnoses[answerID] = append(s.diagnoses[answerID], diagnoses...)
	return diagnoses
}

func (s *MemoryStore) CreateReview(review model.ReviewRecord) model.ReviewRecord {
	s.mu.Lock()
	defer s.mu.Unlock()
	review.ID = s.id("review")
	review.CreatedAt = time.Now()
	s.reviews[review.ID] = review
	return review
}
