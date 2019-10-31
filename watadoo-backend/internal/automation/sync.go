package automation

import (
	"context"
	"fmt"
	"time"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo/watadoo-backend/internal/wordpress"
)

// ImportVenuesInWP import all new venues from our DB in the Wordpress site.
func ImportVenuesInWP(client *prisma.Client, token string) {
	ctx := context.TODO()
	// The default value is 0. The GO Client can't query null values... bummer.
	d := int32(0)
	venues, _ := client.Venues(&prisma.VenuesParams{
		Where: &prisma.VenueWhereInput{
			WpFrId: &d,
		},
	}).Exec(ctx)

	for _, venue := range venues {
		if venue.Lat == 0 {
			fmt.Printf("Skipping %s. No lat/long.\n", venue.NameFr)
			continue
		}
		err := wordpress.ImportVenue(venue, token, client)
		if err != nil {
			fmt.Println(err)
			continue
		}
		fmt.Printf("Imported %s\n", venue.NameFr)
	}
}

// SyncEventsWithWP import all new venues from our DB in the Wordpress site.
func SyncEventsWithWP(client *prisma.Client, token string) {
	ctx := context.TODO()

	now := time.Now().Format(time.RFC3339)
	unknown := prisma.EventCategoryUnknown
	events, _ := client.Events(&prisma.EventsParams{
		Where: &prisma.EventWhereInput{
			CategoryNot: &unknown,
			OccurrencesSome: &prisma.EventOccurrenceWhereInput{
				StartDateGte: &now,
			},
		},
	}).Exec(ctx)

	for _, event := range events {
		err := wordpress.SyncEvent(event, token, client)
		if err != nil {
			fmt.Println(err)
			continue
		}
	}
}
