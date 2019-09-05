package main

import (
	// "encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	// "github.com/afunnydev/watadoo/watadoo-backend/internal/automation"
	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	// "github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper"
	// "github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		panic(err.Error())
	}
	time.Local = loc
}

func main() {
	prismaSecret, exist := os.LookupEnv("PRISMA_SECRET")
	if exist != true {
		log.Fatal("Can't set env variables correctly.")
	}

	prismaEndpoint := os.Getenv("PRISMA_ENDPOINT")
	options := prisma.Options{
		Endpoint: prismaEndpoint,
		Secret:   prismaSecret,
	}
	client := prisma.New(&options)
	fmt.Println(client)

	// // spider := models.GetOttawaTourismSpider()

	// // events, _ := scraper.FetchListPage(spider)
	// // fmt.Printf("There's %d from this source\n", len(events))

	// events, _ := scraper.FetchTourismeOutaouais()

	// fileName := "output/events.json"
	// fileWriter, err := os.Create(fileName)
	// if err != nil {
	// 	fmt.Println(err)
	// }
	// defer fileWriter.Close()

	// json.NewEncoder(fileWriter).Encode(events)

	// for _, event := range events {
	// 	newEvent := automation.CreateEvent(event, client)
	// 	if newEvent != nil {
	// 		fmt.Println("PRISMA EVENT", newEvent.ID)
	// 	} else {
	// 		fmt.Println("Couldn't create:", event.Name)
	// 	}
	// }
}
