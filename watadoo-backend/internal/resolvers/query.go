package resolvers

import (
	"context"
	"fmt"

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
func (r *queryResolver) Events(ctx context.Context, where *prisma.EventWhereInput, orderBy *prisma.EventOrderByInput) ([]prisma.Event, error) {

	if user := auth.UserFromContext(ctx); user == nil || !auth.IsAdmin(user.Permissions) {
		return nil, fmt.Errorf("Access denied")
	}

	// orderBy := prisma.EventOrderByInputNextOccurrenceDateAsc
	// now := time.Now().Format(time.RFC3339)
	// eventWhereInput := prisma.EventWhereInput{
	// 	OccurrencesSome: &prisma.EventOccurrenceWhereInput{
	// 		StartDateGte: &now,
	// 	},
	// }

	// if where != nil {
	// 	// I prefer Dsc because I want to see the most recent event first, but for now there's some event with null in the createdAt field so they appear first.
	// 	orderBy = prisma.EventOrderByInputCreatedAtAsc
	// 	eventWhereInput = *where
	// }

	return r.Prisma.Events(&prisma.EventsParams{
		Where:   where,
		OrderBy: orderBy,
	}).Exec(ctx)
}
func (r *queryResolver) Venues(ctx context.Context, where *prisma.VenueWhereInput) ([]prisma.Venue, error) {
	return r.Prisma.Venues(&prisma.VenuesParams{
		Where: where,
	}).Exec(ctx)
}
