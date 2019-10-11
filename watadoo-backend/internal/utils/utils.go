package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"googlemaps.github.io/maps"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

func init() {
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
}

// CreatePrismaClient returns a configured Prisma Client
func CreatePrismaClient() (*prisma.Client, error) {
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

// CreateGoogleClient returns a configured Google Client
func CreateGoogleClient() (*maps.Client, error) {
	geocodeAPIKey, exist := os.LookupEnv("GEOCODE_API_KEY")
	if exist != true {
		return nil, errors.New("can't set google maps env variables correctly")
	}

	return maps.NewClient(maps.WithAPIKey(geocodeAPIKey))
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

// GetJWTToken retrieves a JWT token from the WP site, using an admin user.
func GetJWTToken() (string, error) {
	wpUsername, exist := os.LookupEnv("WP_USERNAME")
	if exist != true {
		return "", errors.New("can't set wp env variables correctly")
	}
	wpPassword := os.Getenv("WP_PASSWORD")

	message := map[string]interface{}{
		"username": wpUsername,
		"password": wpPassword,
	}

	bytesRepresentation, err := json.Marshal(message)
	if err != nil {
		return "", err
	}

	resp, err := http.Post("https://watadoo.ca/wp-json/jwt-auth/v1/token", "application/json", bytes.NewBuffer(bytesRepresentation))
	if err != nil {
		return "", err
	}

	var result map[string]string

	json.NewDecoder(resp.Body).Decode(&result)

	return result["token"], nil
}
