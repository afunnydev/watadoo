package resolvers

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"

	"github.com/afunnydev/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo-backend/pkg/auth"
)

type mutationResolver struct{ *Resolver }

func (r *mutationResolver) SignIn(ctx context.Context, email string, password string) (*prisma.User, error) {
	// 0. If there's a user, no need to do anything. This should be changed but it will do while we can't logout..
	if user := auth.UserFromContext(ctx); user != nil {
		return user, nil
	}
	// 1. Lowercase their email
	email = strings.ToLower(email)
	// 2. Check if there is a user with that email
	user, err := r.Prisma.User(prisma.UserWhereUniqueInput{Email: &email}).Exec(ctx)
	if err != nil || user == nil {
		return nil, err
	}
	// 3. Check if the password is correct
	err = bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(password))
	if err != nil {
		return nil, err
	}
	// 4. Generate the JTW Token
	secretKey := os.Getenv("SECRET_KEY")
	mySigningKey := []byte(secretKey)
	now := time.Now()

	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"iat":    now,
		"exp":    now.Add(time.Hour * 24 * 14),
		"userId": user.ID,
	})
	tokenString, err := token.SignedString(mySigningKey)
	if err != nil {
		return nil, err
	}

	// 5. Set the response cookie with the token
	dummyToken := auth.TokenFromContext(ctx)
	*dummyToken = tokenString

	return user, err
}

func (r *mutationResolver) UpdateEvent(ctx context.Context, eventID string, event prisma.EventUpdateInput) (*prisma.Event, error) {

	if user := auth.UserFromContext(ctx); user == nil || !auth.IsAdmin(user.Permissions) {
		return nil, fmt.Errorf("Access denied")
	}

	return r.Prisma.UpdateEvent(prisma.EventUpdateParams{
		Data:  event,
		Where: prisma.EventWhereUniqueInput{ID: &eventID},
	}).Exec(ctx)
}

func (r *mutationResolver) UpdateVenue(ctx context.Context, venueID string, venue prisma.VenueUpdateInput) (*prisma.Venue, error) {
	if user := auth.UserFromContext(ctx); user == nil || !auth.IsAdmin(user.Permissions) {
		return nil, fmt.Errorf("Access denied")
	}

	return r.Prisma.UpdateVenue(prisma.VenueUpdateParams{
		Data:  venue,
		Where: prisma.VenueWhereUniqueInput{ID: &venueID},
	}).Exec(ctx)
}

func (r *mutationResolver) CreateEvent(ctx context.Context, name string) (*prisma.Event, error) {
	if user := auth.UserFromContext(ctx); user == nil || !auth.IsAdmin(user.Permissions) {
		return nil, fmt.Errorf("Access denied")
	}
	source := "manual"
	return r.Prisma.CreateEvent(prisma.EventCreateInput{
		Name:   name,
		Link:   "",
		Source: &source,
	}).Exec(ctx)
}
func (r *mutationResolver) CreateVenue(ctx context.Context, name string) (*prisma.Venue, error) {
	if user := auth.UserFromContext(ctx); user == nil || !auth.IsAdmin(user.Permissions) {
		return nil, fmt.Errorf("Access denied")
	}

	return r.Prisma.CreateVenue(prisma.VenueCreateInput{
		NameFr: name,
		NameEn: name,
		Lat:    0,
		Long:   0,
		City:   prisma.CityGatineau,
	}).Exec(ctx)
}
