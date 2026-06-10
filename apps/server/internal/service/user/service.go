package user

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/model"
	"github.com/kidyfirst/MyErrorBook/apps/server/internal/repository"
)

type Clock func() time.Time

type Service struct {
	store *repository.MemoryStore
	now   Clock
}

type WeChatLoginInput struct {
	OpenID   string
	Phone    string
	Nickname string
	Province string
	Grade    string
}

type LoginResult struct {
	User    model.User    `json:"user"`
	Session model.Session `json:"session"`
}

func NewService(store *repository.MemoryStore, now Clock) *Service {
	if now == nil {
		now = time.Now
	}
	return &Service{store: store, now: now}
}

func (s *Service) LoginWithWeChat(input WeChatLoginInput) (LoginResult, error) {
	if input.OpenID == "" || input.Phone == "" || input.Province == "" || input.Grade == "" {
		return LoginResult{}, errors.New("openid, phone, province and grade are required")
	}
	u, ok := s.store.FindUserByOpenID(input.OpenID)
	if !ok {
		u = s.store.CreateUser(model.User{
			Nickname:   input.Nickname,
			Phone:      input.Phone,
			WeChatOpen: input.OpenID,
			ProvinceID: input.Province,
			GradeID:    input.Grade,
		})
	}
	s.store.EnsureDefaultNotebook(u.ID)
	now := s.now()
	sum := sha256.Sum256([]byte(u.ID + input.OpenID + now.String()))
	session := s.store.CreateSession(model.Session{
		UserID:    u.ID,
		TokenHash: hex.EncodeToString(sum[:]),
		ExpiresAt: now.Add(30 * 24 * time.Hour),
	})
	return LoginResult{User: u, Session: session}, nil
}
