package handler

import (
	"errors"
	"net/http"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
)

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=20"`
	Phone    string `json:"phone" binding:"required"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (s *Server) registerHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userParam := &domain.UserCreate{
		Email:    req.Email,
		Password: req.Password,
		Phone:    req.Phone,
		Role:     domain.Role(req.Role),
	}

	userDB, err := s.authService.RegisterUser(ctx, userParam)
	if err != nil {
		if errors.Is(err, domain.ErrUserWithTheEmailAlreadyExist) || errors.Is(err, domain.ErrUserWithThePhoneAlreadyExist) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, userDB)
}

func (s *Server) loginHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, refreshToken, err := s.authService.Login(ctx, req.Email, req.Password, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	isProd := s.config.Environment == "production"
	c.SetCookie("refresh_token", refreshToken, int(s.config.RefreshExpiry.Seconds()), "/", "", isProd, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    1800,
	})
}

func (s *Server) refreshHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req RefreshRequest
	_ = c.ShouldBindJSON(&req)

	refreshToken := req.RefreshToken
	if refreshToken == "" {
		refreshToken, _ = c.Cookie("refresh_token")
	}

	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token is required"})
		return
	}

	newAccessToken, newRefreshToken, err := s.authService.Refresh(ctx, refreshToken, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	isProd := s.config.Environment == "production"
	c.SetCookie("refresh_token", newRefreshToken, int(s.config.RefreshExpiry.Seconds()), "/", "", isProd, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token":  newAccessToken,
		"refresh_token": newRefreshToken,
		"expires_in":    1800,
	})
}

func (s *Server) logoutHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req LogoutRequest
	_ = c.ShouldBindJSON(&req)

	refreshToken := req.RefreshToken
	if refreshToken == "" {
		refreshToken, _ = c.Cookie("refresh_token")
	}

	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token is required"})
		return
	}

	err := s.authService.Logout(ctx, refreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	isProd := s.config.Environment == "production"
	c.SetCookie("refresh_token", "", -1, "/", "", isProd, true)

	c.JSON(http.StatusOK, gin.H{"message": "successfully logged out"})
}
