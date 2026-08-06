package handler

import (
	"errors"
	"net/http"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
)

// registerHandler handles user registration.
// @Summary      Register a new user
// @Description  Register a new user in the system.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body RegisterRequest true "Registration Info"
// @Success      201  {object}  domain.UserDB
// @Failure      400  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Router       /api/v1/auth/register [post]
func (s *Server) registerHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userParam := &domain.UserCreate{
		Email:    req.Email,
		Password: req.Password,
		Phone:    req.Phone,
		Role:     domain.Role(req.Role),
		FullName: req.FullName,
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

// loginHandler handles user login.
// @Summary      Login user
// @Description  Authenticate user with email and password to receive tokens.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body LoginRequest true "Login Credentials"
// @Success      200  {object}  map[string]any
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /api/v1/auth/login [post]
func (s *Server) loginHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req domain.LoginRequest
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
		"access_token": accessToken,
		"expires_in":   int(s.config.JWTExpiry.Seconds()),
	})
}

// refreshHandler refreshes the JWT access token.
// @Summary      Refresh token
// @Description  Refresh expired access token using the refresh token.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body RefreshRequest false "Refresh Token (can also be passed as Cookie)"
// @Success      200  {object}  map[string]any
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /api/v1/auth/refresh [post]
func (s *Server) refreshHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req domain.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.RefreshToken = ""
	}

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
		if errors.Is(err, domain.ErrRefreshTokenReuse) {
			isProd := s.config.Environment == "production"
			c.SetCookie("refresh_token", "", -1, "/", "", isProd, true)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "session revoked, please log in again"})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	isProd := s.config.Environment == "production"
	c.SetCookie("refresh_token", newRefreshToken, int(s.config.RefreshExpiry.Seconds()), "/", "", isProd, true)

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
		"expires_in":   int(s.config.JWTExpiry.Seconds()),
	})
}

// logoutHandler invalidates the refresh token and logs out the user.
// @Summary      Logout user
// @Description  Log out the current user and invalidate their session.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body LogoutRequest false "Logout Request (can also be passed as Cookie)"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/v1/auth/logout [post]
func (s *Server) logoutHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var req domain.LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.RefreshToken = ""
	}

	refreshToken := req.RefreshToken
	if refreshToken == "" {
		refreshToken, _ = c.Cookie("refresh_token")
	}

	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token is required"})
		return
	}

	err := s.authService.Logout(ctx, refreshToken)
	if err != nil && !errors.Is(err, domain.ErrSessionNotFound) {
		// ErrSessionNotFound is idempotent: an already-expired or rotated token
		// means the session is already gone, which is the desired end state.
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	isProd := s.config.Environment == "production"
	c.SetCookie("refresh_token", "", -1, "/", "", isProd, true)

	c.JSON(http.StatusOK, gin.H{"message": "successfully logged out"})
}
