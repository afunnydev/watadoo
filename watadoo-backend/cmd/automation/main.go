package main

import (
	"flag"
	"fmt"
	"log"
	"time"

	"github.com/afunnydev/watadoo/watadoo-backend/internal/automation"
	"github.com/afunnydev/watadoo/watadoo-backend/internal/utils"
	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper"
	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

func init() {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		panic(err.Error())
	}
	time.Local = loc
}

func main() {
	var toJSON bool
	var save bool
	flag.BoolVar(&toJSON, "json", false, "If you want the scraping result to be exported in a JSON file.")
	flag.BoolVar(&save, "save", false, "If you want to save the result to the database.")
	flag.Parse()

	client, err := utils.CreatePrismaClient()
	if err != nil {
		log.Fatal(err)
	}

	var events []models.Event
	spiders := models.GetCronSpiders()

	for _, spider := range spiders {
		spiderEvents, _ := scraper.FetchListPage(spider)
		fmt.Printf("There's %d from %s\n", len(spiderEvents), spider.Domain)
		events = append(events, spiderEvents...)
	}

	// All the special scrapers need to be run manually
	tourismeOutaouaisEvents, _ := scraper.FetchTourismeOutaouais()
	events = append(events, tourismeOutaouaisEvents...)

	facebookPages := []string{
		"https://m.facebook.com/BarMinotaure/events",
		"https://m.facebook.com/cafebistroletroquet/events",
		"https://m.facebook.com/barrymores.ottawa/events",
		"https://m.facebook.com/bistroepicure.ca/events",
		"https://m.facebook.com/OuQuoiLounge/events",
		"https://m.facebook.com/diefenbunker/events",
		"https://m.facebook.com/monkeyottawa/events",
		"https://m.facebook.com/British.ca/pages/permalink/?view_type=tab_events",
		"https://m.facebook.com/LaNouvelleScene/events",
		"https://m.facebook.com/legainsbourg/events",
	}
	for _, facebookPage := range facebookPages {
		facebookEvents, _ := scraper.FetchFacebook(facebookPage)
		events = append(events, facebookEvents...)
	}

	if save != true || toJSON == true {
		utils.SaveToJSON(&events)
	}

	if save == true {
		var created int
		googleClient, err := utils.CreateGoogleClient()
		if err != nil {
			log.Fatal(err)
		}
		for _, event := range events {
			newEvent := automation.CreateEvent(event, client, googleClient)
			if newEvent != nil {
				fmt.Println("PRISMA EVENT", newEvent.ID)
				created++
			} else {
				fmt.Println("Couldn't create:", event.Name)
			}
		}
		fmt.Printf("Just created %d events out of %d scraped events.", created, len(events))
	}

	// Import events in the WP
}
