package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	router := gin.Default()
	api := router.Group("/api")
	registerUsers(api)
	router.Handle(http.MethodGet, "/health", health)
}
