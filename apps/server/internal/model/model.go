package model

import "time"

type User struct {
	ID         string    `json:"id"`
	Nickname   string    `json:"nickname"`
	AvatarURL  string    `json:"avatarUrl"`
	Phone      string    `json:"phone"`
	WeChatOpen string    `json:"wechatOpenid"`
	ProvinceID string    `json:"provinceId"`
	GradeID    string    `json:"gradeId"`
	Role       string    `json:"role"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	RevokedAt time.Time `json:"revokedAt,omitempty"`
}

type Notebook struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsDefault   bool      `json:"isDefault"`
	SortOrder   int       `json:"sortOrder"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ErrorStatus string

const (
	StatusNew       ErrorStatus = "new"
	StatusLearning  ErrorStatus = "learning"
	StatusReviewing ErrorStatus = "reviewing"
	StatusMastered  ErrorStatus = "mastered"
	StatusArchived  ErrorStatus = "archived"
)

type ErrorItem struct {
	ID                      string      `json:"id"`
	UserID                  string      `json:"userId"`
	NotebookID              string      `json:"notebookId"`
	ProvinceID              string      `json:"provinceId"`
	AISuggestedGradeID      string      `json:"aiSuggestedGradeId"`
	ConfirmedGradeID        string      `json:"confirmedGradeId"`
	AISuggestedSubject      string      `json:"aiSuggestedSubject"`
	ConfirmedSubject        string      `json:"confirmedSubject"`
	Term                    string      `json:"term"`
	QuestionType            string      `json:"questionType"`
	QuestionText            string      `json:"questionText"`
	UserAnswer              string      `json:"userAnswer"`
	CorrectAnswer           string      `json:"correctAnswer"`
	Analysis                 string      `json:"analysis"`
	Difficulty              string      `json:"difficulty"`
	Status                  ErrorStatus `json:"status"`
	ConsecutiveCorrectCount int         `json:"consecutiveCorrectCount"`
	WrongCount              int         `json:"wrongCount"`
	ReviewCount             int         `json:"reviewCount"`
	NextReviewAt            time.Time   `json:"nextReviewAt,omitempty"`
	LastReviewedAt          time.Time   `json:"lastReviewedAt,omitempty"`
	KnowledgePointIDs       []string    `json:"knowledgePointIds"`
	CreatedAt               time.Time   `json:"createdAt"`
	UpdatedAt               time.Time   `json:"updatedAt"`
}

type GradeResult string

const (
	GradeCorrect   GradeResult = "correct"
	GradePartial   GradeResult = "partial"
	GradeWrong     GradeResult = "wrong"
	GradeUncertain GradeResult = "uncertain"
)

type AnswerRecord struct {
	ID             string      `json:"id"`
	UserID         string      `json:"userId"`
	ErrorItemID    string      `json:"errorItemId"`
	ReviewRecordID string      `json:"reviewRecordId"`
	AnswerText     string      `json:"answerText"`
	AnswerImages   []string    `json:"answerImages"`
	SubmittedAt    time.Time   `json:"submittedAt"`
	GradeResult    GradeResult `json:"gradeResult"`
	Score          int         `json:"score"`
	Confidence     float64     `json:"confidence"`
	GradeReason    string      `json:"gradeReason"`
	CreatedAt      time.Time   `json:"createdAt"`
}

type AnswerKnowledgeDiagnosis struct {
	ID               string    `json:"id"`
	AnswerRecordID   string    `json:"answerRecordId"`
	KnowledgePointID string    `json:"knowledgePointId"`
	DiagnosisType    string    `json:"diagnosisType"`
	Severity         string    `json:"severity"`
	Evidence         string    `json:"evidence"`
	AIExplanation    string    `json:"aiExplanation"`
	CreatedAt        time.Time `json:"createdAt"`
}

type ReviewRecord struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	ErrorItemID    string    `json:"errorItemId"`
	RecommendedAt  time.Time `json:"recommendedAt"`
	AnsweredAt     time.Time `json:"answeredAt"`
	AnswerRecordID string    `json:"answerRecordId"`
	IsCorrect      bool      `json:"isCorrect"`
	NextReviewAt   time.Time `json:"nextReviewAt"`
	ReviewStage    int       `json:"reviewStage"`
	CreatedAt      time.Time `json:"createdAt"`
}

type AITask struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Status    string    `json:"status"`
	ErrorID   string    `json:"errorId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}
