package models

import (
	"time"
)

// Event stores information about a scraped event.
type Event struct {
	Name        string
	Description string
	Link        string
	Image       string
	StartDate   time.Time
	VenueName   string
	Price       int32
	Location    string
	TicketURL   string
	Source      string
	City        string
	Tags        []string
	Notes string
}
