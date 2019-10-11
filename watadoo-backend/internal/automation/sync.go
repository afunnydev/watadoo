package automation

import (
	"context"
	"fmt"
	"log"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo/watadoo-backend/internal/wordpress"
)

// ImportVenuesInWP import all new venues from our DB in the Wordpress site.
func ImportVenuesInWP(client *prisma.Client, token string) {
	ctx := context.TODO()
	// The default value is 0. The GO Client can't query null values... bummer.
	d := int32(0)
	// venues, _ := client.Venues(nil).Exec(ctx)
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
			log.Fatal(err)
		}
		fmt.Printf("Imported %s\n", venue.NameFr)
	}
}
