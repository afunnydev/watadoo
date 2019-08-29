package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/99designs/gqlgen/handler"

	"github.com/afunnydev/watadoo-backend/pkg/auth"
	prisma "github.com/afunnydev/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo-backend/internal/resolvers"
)

const defaultPort = "8080"

func init() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

func main() {
	// Should be able to get it from .env or from Heroku env.
	prismaSecret, exist := os.LookupEnv("PRISMA_SECRET")
	if exist != true {
		log.Fatal("Can't set env variables correctly.")
	}
	prismaEndpoint := os.Getenv("PRISMA_ENDPOINT")

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	options := prisma.Options{
		Endpoint: prismaEndpoint,
		Secret:   prismaSecret,
	}
	client := prisma.New(&options)
	resolver := resolvers.Resolver{
		Prisma: client,
	}

	router := chi.NewRouter()
	router.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://epic-mirzakhani-6e1302.netlify.com"},
		AllowCredentials: true,
		Debug:            false,
	}).Handler)
	router.Use(auth.Middleware(client))

	router.Handle("/", handler.Playground("GraphQL playground", "/query"))
	router.Handle("/query",
		handler.GraphQL(resolvers.NewExecutableSchema(resolvers.Config{Resolvers: &resolver})),
	)

	log.Printf("Connect to http://localhost:%s/ for GraphQL playground", port)
	err := http.ListenAndServe(":"+port, router)
	if err != nil {
		panic(err)
	}
}
