package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
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
	client, err := utils.CreatePrismaClient()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(client)

	spider := models.GetTodoCanadaSpider()
	// GetOttawaTourismSpider
	// GetCNASpider
	// GetHouseOfTargSpider
	// GetOvationSpider
	// GetLiveOnElginSpider
	// GetTodoCanadaSpider

	events, _ := scraper.FetchListPage(spider)
	fmt.Printf("There's %d from this source\n", len(events))

	// events, _ := scraper.FetchTourismeOutaouais()

	fileName := "output/events.json"
	fileWriter, err := os.Create(fileName)
	if err != nil {
		fmt.Println(err)
	}
	defer fileWriter.Close()

	json.NewEncoder(fileWriter).Encode(events)

	for _, event := range events {
		newEvent := automation.CreateEvent(event, client)
		if newEvent != nil {
			fmt.Println("PRISMA EVENT", newEvent.ID)
		} else {
			fmt.Println("Couldn't create:", event.Name)
		}
	}
}
