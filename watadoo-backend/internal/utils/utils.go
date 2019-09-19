package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/joho/godotenv"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

// CreatePrismaClient returns a configured Prisma Client
func CreatePrismaClient() (*prisma.Client, error) {
	env := os.Getenv("WATADOO_ENV")
	if "" == env {
		env = "development"
	}

	godotenv.Load(".env." + env + ".local")
	if "test" != env {
		godotenv.Load(".env.local")
	}
	godotenv.Load(".env." + env)
	godotenv.Load(".env")

	prismaSecret, exist := os.LookupEnv("PRISMA_SECRET")
	if exist != true {
		return nil, errors.New("can't set env variables correctly")
	}

	prismaEndpoint := os.Getenv("PRISMA_ENDPOINT")
	options := prisma.Options{
		Endpoint: prismaEndpoint,
		Secret:   prismaSecret,
	}
	return prisma.New(&options), nil
}

// SaveToJSON saves an array of events in a JSON file
func SaveToJSON(events *[]models.Event) {
	fileName := "output/events.json"
	fileWriter, err := os.Create(fileName)
	if err != nil {
		fmt.Println(err)
	}
	defer fileWriter.Close()

	json.NewEncoder(fileWriter).Encode(&events)
}
