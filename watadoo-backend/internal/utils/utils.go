package utils

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
)

// CreatePrismaClient returns a configured Prisma Client
func CreatePrismaClient() (*prisma.Client, error) {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
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
