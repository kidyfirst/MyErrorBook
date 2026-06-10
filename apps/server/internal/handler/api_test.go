package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/handler"
)

func TestAPISupportsMVPFlow(t *testing.T) {
	api := handler.NewAPI()

	loginBody := bytes.NewBufferString(`{"openid":"openid-1","phone":"13800138000","nickname":"Ada","province":"guangdong","grade":"grade-8"}`)
	loginReq := httptest.NewRequest(http.MethodPost, "/api/auth/wechat/callback", loginBody)
	loginRec := httptest.NewRecorder()
	api.ServeHTTP(loginRec, loginReq)
	if loginRec.Code != http.StatusOK {
		t.Fatalf("login status = %d body=%s", loginRec.Code, loginRec.Body.String())
	}
	var login struct {
		User struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if err := json.Unmarshal(loginRec.Body.Bytes(), &login); err != nil {
		t.Fatal(err)
	}
	if login.User.ID == "" {
		t.Fatal("expected user id")
	}

	confirmBody := bytes.NewBufferString(`{"questionText":"2 + 3 = ?","correctAnswer":"5","analysis":"addition","confirmedSubject":"math","confirmedGradeId":"grade-8","aiSuggestedSubject":"math","aiSuggestedGradeId":"grade-8","provinceId":"guangdong","knowledgePointIds":["kp-addition"]}`)
	confirmReq := httptest.NewRequest(http.MethodPost, "/api/error-items/confirm?userId="+login.User.ID, confirmBody)
	confirmRec := httptest.NewRecorder()
	api.ServeHTTP(confirmRec, confirmReq)
	if confirmRec.Code != http.StatusOK {
		t.Fatalf("confirm status = %d body=%s", confirmRec.Code, confirmRec.Body.String())
	}
	var confirm struct {
		ID         string `json:"id"`
		NotebookID string `json:"notebookId"`
	}
	if err := json.Unmarshal(confirmRec.Body.Bytes(), &confirm); err != nil {
		t.Fatal(err)
	}
	if confirm.NotebookID == "" {
		t.Fatal("expected default notebook id")
	}

	answerBody := bytes.NewBufferString(`{"userId":"` + login.User.ID + `","errorItemId":"` + confirm.ID + `","answerText":"4"}`)
	answerReq := httptest.NewRequest(http.MethodPost, "/api/daily-question/answer", answerBody)
	answerRec := httptest.NewRecorder()
	api.ServeHTTP(answerRec, answerReq)
	if answerRec.Code != http.StatusOK {
		t.Fatalf("answer status = %d body=%s", answerRec.Code, answerRec.Body.String())
	}
	var answer struct {
		Grading struct {
			Diagnoses []struct {
				KnowledgePointID string `json:"knowledgePointId"`
			} `json:"diagnoses"`
		} `json:"grading"`
	}
	if err := json.Unmarshal(answerRec.Body.Bytes(), &answer); err != nil {
		t.Fatal(err)
	}
	if len(answer.Grading.Diagnoses) != 1 || answer.Grading.Diagnoses[0].KnowledgePointID != "kp-addition" {
		t.Fatalf("expected knowledge diagnosis, got %#v", answer.Grading.Diagnoses)
	}
}
