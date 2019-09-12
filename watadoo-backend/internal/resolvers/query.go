package resolvers

import (
	"context"
	"fmt"
	"time"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo/watadoo-backend/pkg/auth"
)

type queryResolver struct{ *Resolver }

func (r *queryResolver) Event(ctx context.Context, id string) (*prisma.Event, error) {
	return r.Prisma.Event(prisma.EventWhereUniqueInput{ID: &id}).Exec(ctx)
}
func (r *queryResolver) Venue(ctx context.Context, id string) (*prisma.Venue, error) {
	return r.Prisma.Venue(prisma.VenueWhereUniqueInput{ID: &id}).Exec(ctx)
}
func (r *queryResolver) Events(ctx context.Context, withoutOccurrence bool) ([]*prisma.Event, error) {
	var pointerToEvents []*prisma.Event

	if user := auth.UserFromContext(ctx); user == nil || !auth.IsAdmin(user.Permissions) {
		return pointerToEvents, fmt.Errorf("Access denied")
	}

	orderBy := prisma.EventOrderByInputNextOccurrenceDateAsc
	now := time.Now().Format(time.RFC3339)
	eventWhereInput := prisma.EventWhereInput{
		OccurrencesSome: &prisma.EventOccurrenceWhereInput{
			StartDateGte: &now,
		},
	}

	if withoutOccurrence == true {
		// I prefer Dsc because I want to see the most recent event first, but for now there's some event with null in the createdAt field so they appear first.
		orderBy = prisma.EventOrderByInputCreatedAtAsc
		eventWhereInput = prisma.EventWhereInput{
			OccurrencesNone: &prisma.EventOccurrenceWhereInput{
				IDNot: nil,
			},
		}
	}

	events, err := r.Prisma.Events(&prisma.EventsParams{
		Where:   &eventWhereInput,
		OrderBy: &orderBy,
	}).Exec(ctx)
	if err != nil {
		return pointerToEvents, err
	}

	for i := 0; i < len(events); i++ {
		pointerToEvents = append(pointerToEvents, &events[i])
	}

	return pointerToEvents, err
}
func (r *queryResolver) Venues(ctx context.Context) ([]*prisma.Venue, error) {
	venues, err := r.Prisma.Venues(nil).Exec(ctx)
	var pointerToVenues []*prisma.Venue

	if err != nil {
		return pointerToVenues, err
	}

	for i := 0; i < len(venues); i++ {
		pointerToVenues = append(pointerToVenues, &venues[i])
	}

	return pointerToVenues, err
}
