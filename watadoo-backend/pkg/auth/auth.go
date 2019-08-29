package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/dgrijalva/jwt-go"

	"github.com/afunnydev/watadoo-backend/internal/generated/prisma-client"
)

// A private key for context that only this package can access. This is important
// to prevent collisions between different context uses
type contextKey struct {
	name string
}

var userCtxKey = &contextKey{"user"}

func validateAndGetUserID(c *http.Cookie) (string, error) {
	secretKey := []byte(os.Getenv("SECRET_KEY"))
	token, err := jwt.Parse(c.Value, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims["userId"].(string), nil
	}
	return "", err
}

// Middleware decodes the share session cookie and packs the session into context
func Middleware(db *prisma.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie("token")
			ctx := r.Context()

			if err != nil || c == nil {
				// Create a struct that can manipulate a dummy cookie that will be set in resolver, if needed
				arw := authResponseWriter{w, "empty"}
				ctx = context.WithValue(ctx, tokenCtxKey, &arw.tokenFromResolver)
				r = r.WithContext(ctx)
				next.ServeHTTP(&arw, r)
				return
			}

			// Get the userId from the token
			userID, err := validateAndGetUserID(c)
			if err != nil {
				http.Error(w, "Invalid cookie", http.StatusForbidden)
				return
			}

			// Get the user from the database
			user, err := db.User(prisma.UserWhereUniqueInput{ID: &userID}).Exec(ctx)

			// Put it in context
			ctx = context.WithValue(ctx, userCtxKey, user)

			// Apply the new context
			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
		})
	}
}

// UserFromContext finds the user from the context. REQUIRES Middleware to have run.
func UserFromContext(ctx context.Context) *prisma.User {
	raw, _ := ctx.Value(userCtxKey).(*prisma.User)
	return raw
}

// IsAdmin checks the permissions of a user to tell if it has the admin permission. Should be refactored to check whatever permission passed.
func IsAdmin(permissions []prisma.Permission) bool {
	for _, p := range permissions {
		if prisma.PermissionAdmin == p {
			return true
		}
	}
	return false
}
