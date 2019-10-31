package wordpress

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	prisma "github.com/afunnydev/watadoo/watadoo-backend/internal/generated/prisma-client"
)

var (
	specialReplacer = strings.NewReplacer("é", "e", "É", "e", "è", "e", "È", "e", "ê", "e", "Ê", "e", "ô", "o", "Ô", "o", "ù", "u", "Ù", "u", "à", "a", "À", "a", "ï", "i", "Ï", "i")
)

// SyncEvent import a event from our database in the Wordpress database
func SyncEvent(event prisma.Event, token string, client *prisma.Client) error {
	if (event.WpFrId == 0 && event.WpEnId != 0) || (event.WpFrId != 0 && event.WpEnId == 0) {
		return fmt.Errorf("only one language has been imported for %s. aborting", event.Name)
	}
	imported := event.WpFrId != 0 && event.WpEnId != 0
	// 1) Import the image, only if it's a not imported event.
	var imgID int32
	if !imported {
		if strings.Contains(event.ImageUrl, "watadoo.ca") {
			imgID = int32(35416)
		} else {
			filename := strings.ToLower(event.Name)
			if len(filename) > 30 {
				filename = filename[:29]
			}
			filename = fmt.Sprintf("%s.jpg", strings.ReplaceAll(specialReplacer.Replace(filename), " ", "-"))
			image, err := createImage(token, filename, event.ImageUrl)
			if err != nil {
				fmt.Printf("Can't create image in WP for %s", event.Name)
				imgID = int32(35416)
			} else {
				imgID = image
			}
		}
	}

	// 2) Import the event in FR and EN
	ctx := context.TODO()
	venue, _ := client.Event(prisma.EventWhereUniqueInput{
		ID: &event.ID,
	}).Venue().Exec(ctx)

	if venue.WpFrId == 0 || venue.WpEnId == 0 {
		return fmt.Errorf("%s venue is not imported in WP. skipping %s", venue.NameFr, event.Name)
	}

	ctx = context.TODO()
	nb := int32(1)
	now := time.Now().Format(time.RFC3339)
	orderBy := prisma.EventOccurrenceOrderByInputStartDateAsc
	nextOccurrence, err := client.EventOccurrences(&prisma.EventOccurrencesParams{
		Where: &prisma.EventOccurrenceWhereInput{
			Event: &prisma.EventWhereInput{
				ID: &event.ID,
			},
			StartDateGte: &now,
		},
		First:   &nb,
		OrderBy: &orderBy,
	}).Exec(ctx)
	if err != nil || len(nextOccurrence) < 1 {
		return errors.New("error with occurrence")
	}

	nextTime, _ := time.Parse(time.RFC3339, nextOccurrence[0].StartDate)
	// Format is "2019-10-09 00:30:00 +0000 UTC". We want "2019-10-08 20:30:00".
	n := strings.Split(nextTime.Add(time.Hour*-4).String(), " ")
	next := strings.Join(n[:2], " ")

	weirdDate := fmt.Sprintf("%s|%s", next, next)
	category := getWPCategory(event.Category)
	region := getWPRegion(string(venue.City))

	eventInfo := map[string]interface{}{
		"title":                       html.EscapeString(event.Name),
		"content":                     nilString(event.Description),
		"akia_start_date":             next,
		"akia_end_date":               next,
		"_event_occurrence_date":      weirdDate,
		"_event_occurrence_last_date": weirdDate,
		"status":                      "publish",
		"achat_de_billets_lien":       nilString(event.TicketUrl),
		"eventId":                     event.ID,
		"event_all_day":               0,
		"source":                      nilString(event.Source),
		"lang":                        "fr",
		"event-category":              category.Fr,
		"event-location":              venue.WpFrId,
		"region":                      region.Fr,
	}
	if !imported {
		eventInfo["featured_media"] = imgID
	}
	var frID int32
	if !imported {
		fmt.Printf("Creating %s\n", event.Name)
		frID, err = createEvent(token, eventInfo)
	} else {
		fmt.Printf("Updating %s\n", event.Name)
		err = updateEvent(token, eventInfo, event.WpFrId)
	}
	if err != nil {
		return err
	}

	eventInfo["lang"] = "en"
	eventInfo["event-category"] = category.En
	eventInfo["event-location"] = venue.WpEnId
	eventInfo["region"] = region.En
	var enID int32
	if !imported {
		enID, err = createEvent(token, eventInfo)
	} else {
		err = updateEvent(token, eventInfo, event.WpEnId)
	}
	if err != nil {
		return err
	}
	// If it was only an update, we end here.
	if imported {
		return nil
	}

	// 3) Link the two translations
	url := fmt.Sprintf("https://watadoo.ca/wp-json/wp/v2/event/%d?translations[en]=%d", frID, enID)
	result, err := postRequest(url, token, nil)
	if err != nil {
		return err
	}
	if _, ok := result["translations"]; !ok {
		return errors.New("couldn't link translations")
	}

	// 4)Save the new info in the DB
	ctx = context.TODO()
	_, err = client.UpdateEvent(prisma.EventUpdateParams{
		Data: prisma.EventUpdateInput{
			WpFrId: &frID,
			WpEnId: &enID,
		},
		Where: prisma.EventWhereUniqueInput{
			ID: &event.ID,
		},
	}).Exec(ctx)
	return err
}

func nilString(s *string) string {
	var r string
	if s != nil {
		r = *s
	}
	return r
}

type wpTranslations struct {
	En int
	Fr int
}

func getWPCategory(c prisma.EventCategory) wpTranslations {
	categoryMap := map[prisma.EventCategory]wpTranslations{
		prisma.EventCategoryActivites: wpTranslations{En: 28658, Fr: 28656},
		prisma.EventCategoryComedy:    wpTranslations{En: 39, Fr: 37},
		prisma.EventCategoryFamily:    wpTranslations{En: 11, Fr: 19},
		prisma.EventCategoryFestivals: wpTranslations{En: 35, Fr: 32},
		prisma.EventCategoryFood:      wpTranslations{En: 43, Fr: 41},
		prisma.EventCategoryMuseums:   wpTranslations{En: 59, Fr: 57},
		prisma.EventCategoryMusic:     wpTranslations{En: 30, Fr: 28},
		prisma.EventCategorySports:    wpTranslations{En: 55, Fr: 53},
		prisma.EventCategoryTheater:   wpTranslations{En: 47, Fr: 45},
		prisma.EventCategoryVariety:   wpTranslations{En: 51, Fr: 49},
		prisma.EventCategoryOther:     wpTranslations{En: 32230, Fr: 32228},
	}
	return categoryMap[c]
}

func getWPRegion(r string) wpTranslations {
	regionMap := map[string]wpTranslations{
		"GATINEAU": wpTranslations{En: 23, Fr: 21},
		"OTTAWA":   wpTranslations{En: 32020, Fr: 32018},
	}
	return regionMap[r]
}

func createImage(token, filename, url string) (int32, error) {
	var ID int32
	resp, err := http.Get(url)
	if err != nil {
		return ID, err
	}
	defer resp.Body.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return ID, err
	}
	_, err = io.Copy(part, resp.Body)

	err = writer.Close()
	if err != nil {
		return ID, err
	}

	client := &http.Client{}

	// Import the venue FR
	req, err := http.NewRequest("POST", "https://watadoo.ca/wp-json/wp/v2/media", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	wpResp, err := client.Do(req)

	if err != nil {
		return ID, err
	}

	var result map[string]interface{}
	json.NewDecoder(wpResp.Body).Decode(&result)

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

func createEvent(token string, data map[string]interface{}) (int32, error) {
	var ID int32
	result, err := postRequest("https://watadoo.ca/wp-json/wp/v2/event", token, data)
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

func updateEvent(token string, data map[string]interface{}, ID int32) error {
	result, err := postRequest(fmt.Sprintf("https://watadoo.ca/wp-json/wp/v2/event/%d", ID), token, data)
	if err != nil {
		return err
	}

	// We just care if an id is returned. It means that it was a success.
	if _, ok := result["id"]; !ok {
		return err
	}
	return nil
}
