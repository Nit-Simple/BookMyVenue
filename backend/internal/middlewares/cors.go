package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS returns a middleware that handles cross-origin requests from the
// configured frontend origins. It reflects an allowed Origin back in the
// response and enables credentials so cookie/token-based auth works.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		allowed[o] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			if _, ok := allowed[origin]; ok {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Access-Control-Allow-Credentials", "true")
				c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
				c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
				c.Header("Access-Control-Max-Age", "86400")
				// Caches must vary on Origin since the header is reflected.
				c.Header("Vary", "Origin")
			}
		}

		// Short-circuit preflight requests.
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
