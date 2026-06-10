package main

import (
	"log"
	"net/http"

	"github.com/kidyfirst/MyErrorBook/apps/server/internal/handler"
)

func main() {
	addr := ":8080"
	log.Printf("MyErrorBook API listening on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, handler.NewAPI()); err != nil {
		log.Fatal(err)
	}
}
