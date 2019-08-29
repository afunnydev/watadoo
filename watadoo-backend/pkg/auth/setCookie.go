package auth

import (
	"context"
	"net/http"
)

var tokenCtxKey = &contextKey{"token"}

type authResponseWriter struct {
	http.ResponseWriter
	tokenFromResolver string
}

func (w *authResponseWriter) Write(b []byte) (int, error) {
	if w.tokenFromResolver != "empty" {
		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    w.tokenFromResolver,
			HttpOnly: true,
			Path:     "/",
		})
	}
	return w.ResponseWriter.Write(b)
}

// TokenFromContext finds the dummy auth token from the context. REQUIRES Middleware to have run.
func TokenFromContext(ctx context.Context) *string {
	raw, _ := ctx.Value(tokenCtxKey).(*string)
	return raw
}
