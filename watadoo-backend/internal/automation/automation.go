package automation

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/hbakhtiyor/strsim"

	"github.com/afunnydev/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo-backend/pkg/scraper/models"
)

func eventExactMatch(name string, link string, startDate time.Time, client *prisma.Client) (*prisma.Event, error) {
	ctx := context.TODO()
	// 1. Exact match on name or URL
	exactMatchEvents, err := client.Events(&prisma.EventsParams{
		Where: &prisma.EventWhereInput{
			Or: []prisma.EventWhereInput{
				prisma.EventWhereInput{Name: &name},
				// I consider Contains because there could be params added to the link or something like that. It should match anyways.
				prisma.EventWhereInput{LinkContains: &link},
			},
		},
	}).Exec(ctx)

	if err != nil {
		return nil, err
	}

	if len(exactMatchEvents) == 0 {
		return nil, nil
	} else if len(exactMatchEvents) == 1 {
		return &exactMatchEvents[0], nil
	}

	var possibleEventNames []string
	for _, exactMatchEvent := range exactMatchEvents {
		possibleEventNames = append(possibleEventNames, exactMatchEvent.Name)
	}

	matchResult, err := strsim.FindBestMatch(name, possibleEventNames)
	if err != nil {
		return nil, err
	}
	return &exactMatchEvents[matchResult.BestMatchIndex], nil

	// for _, event := range exactMatchEvents {
	// 	start, err := time.Parse(time.RFC3339, event.StartDate)
	// 	if err != nil {
	// 		log.Println(err)
	// 		return true
	// 	}

	// 	if startDate.Sub(start) < time.Hour*6 {
	// 		log.Printf("Exact match for %s", name)
	// 		return true
	// 	}
	// }

	// return false
}

func eventsSimilar(name string, startDate time.Time, venueID string, client *prisma.Client) *strsim.Match {
	match := strsim.MatchResult{}
	return match.BestMatch
}

func findPossibleVenues(name string, location string, client *prisma.Client) ([]prisma.Venue, error) {
	ctx := context.TODO()
	venueCriteras := make([]prisma.VenueWhereInput, 0, 3)

	if name != "" {
		venueCriteras = append(venueCriteras, prisma.VenueWhereInput{NameFrContains: &name}, prisma.VenueWhereInput{NameEnContains: &name})
	}

	if location != "" {
		venueCriteras = append(venueCriteras, prisma.VenueWhereInput{AddressContains: &location})
	}

	if len(venueCriteras) == 0 {
		return nil, errors.New("no criteria to find the event's venue")
	}

	// TODO: This will not find similar venues, we should pass more variations of the name and locations..
	return client.Venues(&prisma.VenuesParams{
		Where: &prisma.VenueWhereInput{
			Or: venueCriteras,
		},
	}).Exec(ctx)
}

func findBestMatchingVenue(venueName string, possibleVenues []prisma.Venue) int {
	var possibleVenuesName []string
	for _, possibleVenue := range possibleVenues {
		possibleVenuesName = append(possibleVenuesName, possibleVenue.NameFr)
	}
	matchResult, err := strsim.FindBestMatch(venueName, possibleVenuesName)
	if err != nil {
		log.Println(err)
		return 0
	}
	return matchResult.BestMatchIndex
}

// CreateEvent create an event that was just scraped.
func CreateEvent(event models.Event, client *prisma.Client) *prisma.Event {
	ctx := context.TODO()

	// 1. Do we have this event in the DB?
	existingEvent, err := eventExactMatch(event.Name, event.Link, event.StartDate, client)
	if err != nil {
		fmt.Println("Error while trying to find matching event:", err)
		return nil
	}

	// 2. If we don't have the event in the DB, we should create it, it's venue (if required) and it's occurrences.
	if existingEvent == nil {
		possibleVenues, err := findPossibleVenues(event.VenueName, event.Location, client)
		fmt.Println("Possible Venues: ", possibleVenues)
		if err != nil {
			log.Printf("There was an error looking for the venue of %s.", event.Name)
		}

		var venue prisma.Venue
		var venueInput prisma.VenueCreateOneWithoutEventsInput

		if len(possibleVenues) == 0 {
			log.Printf("No venue found for %s and %s. I will create one.", event.VenueName, event.Location)
			// TODO: We shouldn't create the venue if we don't have enough information.
			// TODO: We should find this location's lat/long through Google, so that Stéfanie doesn't have to do it.
			var defaultLatLong float64
			venueInput = prisma.VenueCreateOneWithoutEventsInput{
				Create: &prisma.VenueCreateWithoutEventsInput{
					NameFr:  event.VenueName,
					NameEn:  event.VenueName,
					Address: &event.Location,
					Lat:     defaultLatLong,
					Long:    defaultLatLong,
				},
			}
		} else {
			var bestMatchIndex int
			if len(possibleVenues) > 1 {
				bestMatchIndex = findBestMatchingVenue(event.VenueName, possibleVenues)
			}
			venue = possibleVenues[bestMatchIndex]
			venueInput = prisma.VenueCreateOneWithoutEventsInput{
				Connect: &prisma.VenueWhereUniqueInput{
					ID: &venue.ID,
				},
			}
		}

		var possibleDuplicate bool
		if venue.NameFr != "" {
			bestMatch := eventsSimilar(event.Name, event.StartDate, venue.ID, client)
			if bestMatch != nil {
				if bestMatch.Score > 0.4 {
					log.Println("Found similar event at this venue with the score of:", bestMatch.Score)
					return nil
				}
				possibleDuplicate = true
			}
		}

		tags := strings.Join(event.Tags, ", ")
		// If it's an empty string, we want to pass a nil pointer so that the default value from DB is applied.
		var eventImage *string
		if event.Image != "" {
			eventImage = &event.Image
		}
		nextOccurrenceDate := event.StartDate.Format(time.RFC3339)

		// This needs to be adusted for the concept of occurrences. Including the city and the startDate.
		newEvent, err := client.CreateEvent(prisma.EventCreateInput{
			Name:               event.Name,
			Description:        &event.Description,
			Link:               event.Link,
			ImageUrl:           eventImage,
			NextOccurrenceDate: &nextOccurrenceDate,
			Price:              &event.Price,
			Venue:              &venueInput,
			Tags:               &tags,
			TicketUrl:          &event.TicketURL,
			Source:             &event.Source,
			PossibleDuplicate:  &possibleDuplicate,
			ImportNotes:        &event.Notes,
		}).Exec(ctx)

		if err != nil {
			fmt.Println(err)
			return nil
		}

		return newEvent
	}

	// 3. If we have the event, we should add the occurrence if we don't have it.
	return nil
}
