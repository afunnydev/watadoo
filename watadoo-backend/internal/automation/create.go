package automation

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/hbakhtiyor/strsim"
	"googlemaps.github.io/maps"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

// CreateEvent create an event that was just scraped.
func CreateEvent(event models.Event, client *prisma.Client, googleClient *maps.Client) *prisma.Event {
	ctx := context.TODO()

	// 1. Where is this event?
	savedVenue, err := findSavedVenue(event.VenueName, event.Location, client)
	if err != nil {
		fmt.Printf("There was an error looking for the venue of %s. The error is %q.\n", event.Name, err)
		// Too risky for duplicates to continue.
		return nil
	}

	var venueInput prisma.VenueCreateOneWithoutEventsInput
	var city prisma.City
	var lat float64
	var long float64

	if savedVenue == nil {
		fmt.Printf("No venue found for %s and %s. I will create one.\n", event.VenueName, event.Location)

		city, err = findCityInAddress(event.Location)
		if err != nil {
			fmt.Printf("Can't create the venue %s because I don't know in which city it is in %s. Aborting.\n", event.VenueName, event.Location)
			return nil
		}

		// Find the zip, address, lat and long from Google Geocode API.
		ctx := context.TODO()
		result, err := googleClient.Geocode(ctx, &maps.GeocodingRequest{
			Address: event.VenueName,
			Components: map[maps.Component]string{
				maps.ComponentCountry: "CA",
			},
		})

		if err != nil || len(result) == 0 {
			fmt.Printf("Can't geocode the venue %s. Err from Google %s. Nb results is %d. Aborting.\n", event.VenueName, err, len(result))
			return nil
		}

		zip := findZipFromGeocoding(result[0].AddressComponents)

		venueInput = prisma.VenueCreateOneWithoutEventsInput{
			Create: &prisma.VenueCreateWithoutEventsInput{
				NameFr:  event.VenueName,
				NameEn:  event.VenueName,
				Address: &result[0].FormattedAddress,
				Lat:     result[0].Geometry.Location.Lat,
				Long:    result[0].Geometry.Location.Lng,
				Zip:     &zip,
				City:    city,
			},
		}
	} else {
		venueInput = prisma.VenueCreateOneWithoutEventsInput{
			Connect: &prisma.VenueWhereUniqueInput{
				ID: &savedVenue.ID,
			},
		}
		city = savedVenue.City
		lat = savedVenue.Lat
		long = savedVenue.Long
	}

	// 2. Do we have this event in the DB?
	var possibleDuplicate bool
	savedEvent, err := findSavedEvent(event.Name, event.Link, savedVenue, &possibleDuplicate, client)
	if err != nil {
		fmt.Printf("Error while trying to find match for event %s: %s\n", event.Name, err)
		return nil
	}

	// 3. If we don't have the event in the DB, we should create it, it's venue (if required) and it's occurrences.
	if savedEvent == nil {
		tags := strings.Join(event.Tags, ", ")
		// If it's an empty string, we want to pass a nil pointer so that the default value from DB is applied.
		var eventImage *string
		if event.Image != "" {
			eventImage = &event.Image
		}
		nextOccurrenceDate := event.StartDate.Format(time.RFC3339)

		category := prisma.EventCategoryOther
		// What is the best way to determine an event's category?
		// 1) Check for specific word in event description + name
		// 2) Check the venue of the event:
		//   - You can set a category for a venue
		//   - You can compare with other events for this venue.

		// This needs to be adusted for the concept of occurrences.
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
			Category:           &category,
			Occurrences: &prisma.EventOccurrenceCreateManyWithoutEventInput{
				Create: []prisma.EventOccurrenceCreateWithoutEventInput{
					{Name: event.Name, Description: &event.Description, ImageUrl: eventImage, StartDate: nextOccurrenceDate, Lat: lat, Long: long, Price: &event.Price, City: city, TicketUrl: &event.TicketURL},
				},
			},
		}).Exec(ctx)

		if err != nil {
			fmt.Println(err)
			return nil
		}

		return newEvent
	}
	fmt.Printf("We have a match between %s and %s at %s.\n", savedEvent.Name, event.Name, savedVenue.NameFr)
	// 3. If we have the event, we should add the occurrence if we don't have it.
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
	return nil
}

func findSavedEvent(name string, link string, venue *prisma.Venue, possibleDuplicate *bool, client *prisma.Client) (*prisma.Event, error) {
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

	if len(exactMatchEvents) > 0 {
		// This is more of an alert. There should be no situation where we can't find a venue, but we have an exact match on the event.
		if venue == nil {
			return nil, errors.New("no venue matched, but we found a matching event")
		}
		var bestMatchIndex int
		match, err := tryMatchingEvent(name, exactMatchEvents)
		if err != nil {
			return nil, err
		}
		if match.BestMatch.Score < 0.5 {
			return nil, errors.New("no event matches with a high enough score, but it's supposed to be an exact match")
		}
		bestMatchIndex = match.BestMatchIndex
		return &exactMatchEvents[bestMatchIndex], nil
	}

	if venue == nil {
		return nil, nil
	}

	possibleEvents, err := findPossibleEvents(name, venue.ID, client)
	if err != nil {
		return nil, err
	}

	if len(possibleEvents) == 0 {
		return nil, nil
	}

	match, err := tryMatchingEvent(name, possibleEvents)
	if err != nil {
		return nil, err
	}
	if match.BestMatch.Score < 0.5 {
		fmt.Printf("The closest matching event is at %f\n", match.BestMatch.Score)
		if match.BestMatch.Score > 0.3 {
			*possibleDuplicate = true
		}
		return nil, nil
	}
	return &possibleEvents[match.BestMatchIndex], nil
}

func tryMatchingEvent(eventName string, possibleEvents []prisma.Event) (*strsim.MatchResult, error) {
	// To make sure he's comparing apple with apple, we use all event name in lowercase. We had a problem with "Là où le sang se mêle" and "Là Où Le Sang Se Mêle"
	var possibleEventsName []string
	for _, possibleEvent := range possibleEvents {
		possibleEventsName = append(possibleEventsName, strings.ToLower(possibleEvent.Name))
	}
	return strsim.FindBestMatch(strings.ToLower(eventName), possibleEventsName)
}

func findPossibleEvents(name string, venueID string, client *prisma.Client) ([]prisma.Event, error) {
	ctx := context.TODO()
	var eventFlexibleCriterias []prisma.EventWhereInput
	return client.Events(&prisma.EventsParams{
		Where: &prisma.EventWhereInput{
			Or: eventFlexibleCriterias,
			Venue: &prisma.VenueWhereInput{
				ID: &venueID,
			},
		},
	}).Exec(ctx)
}

func findSavedVenue(name string, location string, client *prisma.Client) (*prisma.Venue, error) {
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

	exactMatchVenues, err := client.Venues(&prisma.VenuesParams{
		Where: &prisma.VenueWhereInput{
			Or: venueCriteras,
		},
	}).Exec(ctx)
	if err != nil {
		return nil, err
	}

	if len(exactMatchVenues) > 0 {
		var bestMatchIndex int
		if len(exactMatchVenues) > 1 {
			match, err := tryMatchingVenue(name, exactMatchVenues)
			if err != nil {
				return nil, err
			}
			if match.BestMatch.Score < 0.5 {
				return nil, errors.New("no venue matches with a high enough score")
			}
			bestMatchIndex = match.BestMatchIndex
		}
		return &exactMatchVenues[bestMatchIndex], nil
	}

	if location == "" || name == "" {
		return nil, errors.New("don't have enough info to find to appropriate venue")
	}

	possibleVenues, err := findPossibleVenues(location, client)
	if err != nil {
		return nil, err
	}

	if len(possibleVenues) == 0 {
		return nil, nil
	}

	match, err := tryMatchingVenue(name, possibleVenues)
	if err != nil {
		return nil, err
	}
	if match.BestMatch.Score < 0.5 {
		return nil, nil
	}
	return &possibleVenues[match.BestMatchIndex], nil
}

func findPossibleVenues(location string, client *prisma.Client) ([]prisma.Venue, error) {
	ctx := context.TODO()
	// If we don't have exact matches, we need to try variations.
	city, err := findCityInAddress(location)
	if err != nil {
		return nil, errors.New("can't recognize the city in the location")
	}
	var venueFlexibleCriterias []prisma.VenueWhereInput
	explodedLocation := strings.Split(location, ",")
	if len(explodedLocation) > 1 {
		venueFlexibleCriterias = append(venueFlexibleCriterias, prisma.VenueWhereInput{AddressContains: &explodedLocation[0]}, prisma.VenueWhereInput{AddressContains: &explodedLocation[1]})
	} else {
		explodedLocation = strings.Split(location, " ")
		venueFlexibleCriterias = append(venueFlexibleCriterias, prisma.VenueWhereInput{AddressContains: &explodedLocation[0]})
	}

	rePostalCode := regexp.MustCompile("(?i)(\\w\\d\\w ?\\d\\w\\d)")
	pc := rePostalCode.FindString(location)
	if pc != "" {
		if len(pc) == 6 {
			withSpace := fmt.Sprintf("%s %s", pc[:3], pc[3:])
			venueFlexibleCriterias = append(venueFlexibleCriterias, prisma.VenueWhereInput{AddressContains: &pc}, prisma.VenueWhereInput{AddressContains: &withSpace})
		} else if len(pc) == 7 {
			withoutSpace := fmt.Sprintf("%s%s", pc[:3], pc[4:])
			venueFlexibleCriterias = append(venueFlexibleCriterias, prisma.VenueWhereInput{AddressContains: &pc}, prisma.VenueWhereInput{AddressContains: &withoutSpace})
		}
	}

	return client.Venues(&prisma.VenuesParams{
		Where: &prisma.VenueWhereInput{
			Or:   venueFlexibleCriterias,
			City: &city,
		},
	}).Exec(ctx)
}

func tryMatchingVenue(venueName string, possibleVenues []prisma.Venue) (*strsim.MatchResult, error) {
	var possibleVenuesName []string
	for _, possibleVenue := range possibleVenues {
		possibleVenuesName = append(possibleVenuesName, possibleVenue.NameFr)
	}
	return strsim.FindBestMatch(venueName, possibleVenuesName)
}

func findCityInAddress(address string) (prisma.City, error) {
	a := []byte(address)
	reGatineau := regexp.MustCompile("(?i)(Gat(ineau)?|Wakefield|Chelsea|Cantley|Hull|Aylmer|Saint-André-Avellin|St-André-Avellin)")
	reOttawa := regexp.MustCompile("(?i)(Ott(awa)?|Nepean|Orleans|Kanata|Manotick|Orléans)")
	reMontreal := regexp.MustCompile("(?i)(Mtl|Montreal|Montréal)")
	if reGatineau.Match(a) {
		return prisma.CityGatineau, nil
	} else if reOttawa.Match(a) {
		return prisma.CityOttawa, nil
	} else if reMontreal.Match(a) {
		return prisma.CityMontreal, nil
	}
	return prisma.CityGatineau, errors.New("can't find the city in this string")
}

func findZipFromGeocoding(a []maps.AddressComponent) string {
	zip := ""
	// Loop in reverse because postal_code is usually last.
	for i := len(a) - 1; i >= 0; i-- {
		if a[i].Types[0] == "postal_code" {
			zip = a[i].LongName
			break
		}
	}
	return zip
}
