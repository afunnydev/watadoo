package wordpress

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
)

// ImportVenue import a venue from our database in the Wordpress database
func ImportVenue(venue prisma.Venue, token string, client *prisma.Client) error {
	// Format venue info for import
	venueInfo := map[string]interface{}{
		"name":    venue.NameFr,
		"venueId": venue.ID,
		"lang":    "fr",
		"options": map[string]interface{}{
			"google_map": map[string]interface{}{
				"latitude":  venue.Lat,
				"longitude": venue.Long,
			},
			"address": venue.Address,
			"zip":     venue.Zip,
			"country": venue.Country,
			"image":   0,
		},
	}
	frID, err := createVenue(token, venueInfo)
	if err != nil {
		return err
	}

	// Import the venue EN
	venueInfo["lang"] = "en"
	enID, err := createVenue(token, venueInfo)
	if err != nil {
		return err
	}

	// Link the two venues
	url := fmt.Sprintf("https://watadoo.ca/wp-json/wp/v2/event-location/%d?translations[en]=%d", frID, enID)
	result, err := postRequest(url, token, nil)
	if err != nil {
		return err
	}
	if _, ok := result["translations"]; !ok {
		return errors.New("couldn't link translations")
	}

	// Save the new info in the DB
	ctx := context.TODO()
	_, err = client.UpdateVenue(prisma.VenueUpdateParams{
		Data: prisma.VenueUpdateInput{
			WpFrId: &frID,
			WpEnId: &enID,
		},
		Where: prisma.VenueWhereUniqueInput{
			ID: &venue.ID,
		},
	}).Exec(ctx)
	return err
}

func postRequest(url string, token string, data map[string]interface{}) (map[string]interface{}, error) {
	client := &http.Client{}
	formatted, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	// Import the venue FR
	reqEn, err := http.NewRequest("POST", url, bytes.NewBuffer(formatted))
	reqEn.Header.Add("Content-Type", "application/json")
	reqEn.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, err := client.Do(reqEn)

	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

func createVenue(token string, data map[string]interface{}) (int32, error) {
	var ID int32
	result, err := postRequest("https://watadoo.ca/wp-json/wp/v2/event-location", token, data)
	if err != nil {
		return ID, err
	}

	if id, ok := result["id"]; ok {
		tmp, ok := id.(float64)
		if !ok {
			return ID, errors.New("can't find ID for FR")
		}
		ID = int32(tmp)
	} else {
		return ID, errors.New("can't find ID for FR")
	}
	return ID, nil
}
