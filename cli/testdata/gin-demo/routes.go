package main

import "github.com/gin-gonic/gin"

func registerUsers(router *gin.RouterGroup) {
	users := router.Group("/users")
	users.GET("", listUsers)
	users.GET("/:id", getUser)
	users.POST("", createUser)
}
