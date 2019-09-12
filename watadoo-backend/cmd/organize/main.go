package main

import (
	"fmt"
	"log"
	"time"

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
	fmt.Println(client)
}
