// Package resolvers defines all the needed resolvers for our Query and Mutation.
//go:generate go run github.com/99designs/gqlgen
package resolvers

import (
	"context"

	"github.com/afunnydev/watadoo-backend/internal/generated/prisma-client"
)

// THIS CODE IS A STARTING POINT ONLY. IT WILL NOT BE UPDATED WITH SCHEMA CHANGES.

// Resolver defines all the resolvers for our backend.
type Resolver struct {
	Prisma *prisma.Client
}

// Event returns an EventResolver that resolves any subtypes of our Event type (ex: Venue)
func (r *Resolver) Event() EventResolver {
	return &eventResolver{r}
}

// Mutation returns the MutationResolver that resolves all our Mutations.
func (r *Resolver) Mutation() MutationResolver {
	return &mutationResolver{r}
}

// Query returns the QueryResolver that resolves all our Queries.
func (r *Resolver) Query() QueryResolver {
	return &queryResolver{r}
}

// Venue returns an VenueResolver that resolves any subtypes of our Venue type (ex: Events)
func (r *Resolver) Venue() VenueResolver {
	return &venueResolver{r}
}

type eventResolver struct{ *Resolver }

func (r *eventResolver) Venue(ctx context.Context, obj *prisma.Event) (*prisma.Venue, error) {
	// Pretty difficult to find the venue of an event without its ID. Could be improved.
	venues, err := r.Prisma.Venues(&prisma.VenuesParams{
		Where: &prisma.VenueWhereInput{
			EventsSome: &prisma.EventWhereInput{
				ID: &obj.ID,
			},
		},
	}).Exec(ctx)
	if len(venues) == 0 {
		return nil, err
	}
	return &venues[0], err
}

func (r *eventResolver) Occurrences(ctx context.Context, obj *prisma.Event) ([]*prisma.EventOccurrence, error) {
	eventOccurrences, err := r.Prisma.EventOccurrences(&prisma.EventOccurrencesParams{
		Where: &prisma.EventOccurrenceWhereInput{
			Event: &prisma.EventWhereInput{
				ID: &obj.ID,
			},
		},
	}).Exec(ctx)
	var pointerToEventOccurrences []*prisma.EventOccurrence

	if err != nil {
		return pointerToEventOccurrences, err
	}

	for i := 0; i < len(eventOccurrences); i++ {
		pointerToEventOccurrences = append(pointerToEventOccurrences, &eventOccurrences[i])
	}

	return pointerToEventOccurrences, err
}

type venueResolver struct{ *Resolver }

func (r *venueResolver) Events(ctx context.Context, obj *prisma.Venue) ([]*prisma.Event, error) {
	events, err := r.Prisma.Events(&prisma.EventsParams{
		Where: &prisma.EventWhereInput{
			Venue: &prisma.VenueWhereInput{
				ID: &obj.ID,
			},
		},
	}).Exec(ctx)
	var pointerToEvents []*prisma.Event

	if err != nil {
		return pointerToEvents, err
	}

	for i := 0; i < len(events); i++ {
		pointerToEvents = append(pointerToEvents, &events[i])
	}

	return pointerToEvents, err
}
