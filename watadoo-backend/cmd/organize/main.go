package main

import (
	"log"
	"time"

	"github.com/afunnydev/watadoo/watadoo-backend/internal/automation"
	"github.com/afunnydev/watadoo/watadoo-backend/internal/utils"
)

func init() {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		panic(err.Error())
	}
	time.Local = loc
}

func main() {
	client, err := utils.CreatePrismaClient()
	if err != nil {
		log.Fatal(err)
	}

	// Save next occurrence for every events
	err = automation.ManageNextOccurrence(client)
	if err != nil {
		log.Fatal(err)
	}
	// Manage occurrences for recurring events

	// Delete old events and old occurrences

	// Get a JWT from WP
	token, err := utils.GetJWTToken()
	if err != nil {
		log.Fatal(err)
	}
	// // Import venues in WP
	automation.ImportVenuesInWP(client, token)
	// // Import events in WP
	automation.SyncEventsWithWP(client, token)
	// Spot possible duplicated venues
	// Spot possible duplicated events

}
