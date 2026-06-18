package middlewares

import (
	"net/http"

	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/gin-gonic/gin"
)

// RequireRoles checks if the authenticated user has one of the allowed roles
func RequireRoles(allowedRoles ...domain.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: role not found"})
			return
		}

		roleStr, ok := roleVal.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid role format"})
			return
		}

		userRole := domain.Role(roleStr)
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
	}
}
