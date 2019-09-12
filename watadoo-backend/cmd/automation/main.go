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
	flag.BoolVar(&save, "json", false, "If you want to save the result to the database.")
	flag.Parse()

	client, err := utils.CreatePrismaClient()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(client)

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

	if save != true || toJSON == true {
		utils.SaveToJSON(&events)
	}

	if save == true {
		for _, event := range events {
			newEvent := automation.CreateEvent(event, client)
			if newEvent != nil {
				fmt.Println("PRISMA EVENT", newEvent.ID)
			} else {
				fmt.Println("Couldn't create:", event.Name)
			}
		}
	}

	// Import events in the WP
}
