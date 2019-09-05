package scraper

import (
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/araddon/dateparse"
	"github.com/gocolly/colly"

	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

func extractEvent(e *colly.HTMLElement, spider models.Spider) models.Event {
	var notes string
	var name string
	if !spider.EventNameSelector.Attribute {
		name = e.ChildText(spider.EventNameSelector.Selector)
	} else {
		name = e.ChildAttr(spider.EventNameSelector.Selector, spider.EventNameSelector.AttributeName)
	}
	if name == "" {
		log.Println("No title found: ", e.Request.URL)
		return models.Event{}
	}
	// We don't want a title like AERO | LE SPECTACLE AÉRIEN
	if name == strings.ToUpper(name) {
		name = strings.Title(strings.ToLower(name))
	}

	// TODO: Description should be clean AF.
	var description string
	if !spider.EventDescriptionSelector.Attribute {
		description = e.ChildText(spider.EventDescriptionSelector.Selector)
	} else {
		description = e.ChildAttr(spider.EventDescriptionSelector.Selector, spider.EventDescriptionSelector.AttributeName)
	}

	var rawDate string
	var rawTime string

	// TODO: WE should note if there's no time, because if we provide no time the user will receive an event that is happening at 00:00, which is weird... We should at least add a default time.
	if spider.EventStartDateSelector.Separated {
		if !spider.EventStartDateSelector.DaySelector.Attribute {
			rawDate = e.ChildText(spider.EventStartDateSelector.DaySelector.Selector)
		} else {
			rawDate = e.ChildAttr(spider.EventStartDateSelector.DaySelector.Selector, spider.EventStartDateSelector.DaySelector.AttributeName)
		}

		if !spider.EventStartDateSelector.TimeSelector.Attribute {
			rawTime = e.ChildText(spider.EventStartDateSelector.TimeSelector.Selector)
		} else {
			rawTime = e.ChildAttr(spider.EventStartDateSelector.TimeSelector.Selector, spider.EventStartDateSelector.TimeSelector.AttributeName)
		}
	} else {
		if !spider.EventStartDateSelector.DaySelector.Attribute {
			rawDate = e.ChildText(spider.EventStartDateSelector.DaySelector.Selector)
		} else {
			rawDate = e.ChildAttr(spider.EventStartDateSelector.DaySelector.Selector, spider.EventStartDateSelector.DaySelector.AttributeName)
		}
	}

	startDate, _ := handleRawDateTime(rawDate, rawTime, &notes)

	// If the event has a empty time, it doesn't mean that it's in the past, we just couldn't find the appropriate time of this event.
	var reallyOld time.Time
	if startDate != reallyOld && startDate.Before(time.Now()) {
		fmt.Println("Old event. It was at", startDate.Format(time.RFC3339))
		return models.Event{}
	}

	var tags []string
	if spider.EventTagsSelector != "" {
		e.ForEach(spider.EventTagsSelector, func(_ int, el *colly.HTMLElement) {
			tags = append(tags, trimWhiteSpaces(el.Text, ""))
		})
	}

	var location string
	if spider.EventLocationSelector.Selector != "" {
		if !spider.EventLocationSelector.Attribute {
			location = trimWhiteSpaces(e.ChildText(spider.EventLocationSelector.Selector), ", ")
		} else {
			location = trimWhiteSpaces(e.ChildAttr(spider.EventLocationSelector.Selector, spider.EventLocationSelector.AttributeName), ", ")
		}
	}

	var image string
	if spider.EventImageSelector.Selector != "" {
		if !spider.EventImageSelector.Attribute {
			image = e.ChildText(spider.EventImageSelector.Selector)
		} else {
			image = e.ChildAttr(spider.EventImageSelector.Selector, spider.EventImageSelector.AttributeName)
			// Sometimes, the only way is to get the background-image from a style tag.
			if strings.Contains(image, "background-image") {
				regCSS := regexp.MustCompile("\\('?(.*?)'?\\)")
				matches := regCSS.FindStringSubmatch(image)
				if matches != nil && len(matches) > 1 {
					image = matches[1]
					if !strings.Contains(image, "http") {
						image = fmt.Sprintf("%s%s", "http:", image)
					}
				}
			}
		}
	}

	var venueName string
	if spider.VenueNameOverride != "" {
		venueName = spider.VenueNameOverride
	} else {
		if spider.EventVenueNameSelector.Selector != "" {
			if !spider.EventVenueNameSelector.Attribute {
				venueName = e.ChildText(spider.EventVenueNameSelector.Selector)
			} else {
				venueName = e.ChildAttr(spider.EventVenueNameSelector.Selector, spider.EventVenueNameSelector.AttributeName)
			}
		}
	}

	var ticketURL string
	if spider.EventTicketURLSelector.Selector != "" {
		if !spider.EventTicketURLSelector.Attribute {
			ticketURL = e.ChildText(spider.EventTicketURLSelector.Selector)
		} else {
			ticketURL = e.ChildAttr(spider.EventTicketURLSelector.Selector, spider.EventTicketURLSelector.AttributeName)
		}
	}

	var price int32
	if spider.EventPriceSelector.Selector != "" {
		rawPrice := ""
		if !spider.EventPriceSelector.Attribute {
			rawPrice = e.ChildText(spider.EventPriceSelector.Selector)
		} else {
			rawPrice = e.ChildAttr(spider.EventPriceSelector.Selector, spider.EventPriceSelector.AttributeName)
		}

		re := regexp.MustCompile("[0-9]+(\\.|,)?[0-9]*")
		stringedPrices := re.FindAllString(rawPrice, 1)

		if len(stringedPrices) > 0 {
			stringedPrice := strings.Replace(stringedPrices[0], ",", ".", -1)

			intPrice, err := strconv.Atoi(stringedPrice)
			if err != nil {
				priceFloat, _ := strconv.ParseFloat(stringedPrice, 64)
				price = int32(priceFloat * 100)
			} else {
				price = int32(intPrice * 100)
			}
		}
	}

	return models.Event{
		Name:        name,
		Description: description,
		Link:        e.Request.URL.String(),
		Image:       image,
		StartDate:   startDate,
		VenueName:   venueName,
		Location:    location,
		TicketURL:   ticketURL,
		Price:       price,
		Source:      spider.Domain,
		Tags:        tags,
		Notes:       notes,
	}
}

func cleanSpecialCharacters(s string) string {
	// TODO: Colly has problem with special caracters, which are transformed to ?. We should check into this, but for now this will do it.
	r := strings.NewReplacer("é", "e", "û", "u", "?", "e")
	s = r.Replace(s)
	return s
}

func trimWhiteSpaces(s string, replacer string) string {
	s = strings.TrimSpace(s)
	r := strings.NewReplacer("\n", replacer, "\t\t\t\t\t\t\t\t", replacer, "\t\t\t\t\t\t\t", replacer, "\t\t\t\t\t\t", replacer, "\t\t\t\t\t", replacer, "\t\t\t\t", replacer, "\t\t\t", replacer, "\t\t", replacer, "\t", replacer, "  ", " ")
	s = r.Replace(s)
	return s
}

func removeDayOfTheWeek(d string) string {
	reEnglish := regexp.MustCompile("(?i)(Mon|Tues|Wed(nes)?|Thur(s)?|Fri|Sat(ur)?|Sun)(day)?(,)?")
	d = reEnglish.ReplaceAllString(d, "")

	// The [^sc] is the make sure that we don't match on March or Mars.
	reFrench := regexp.MustCompile("(?i)(Lun|Mar|Mer(cre)?|Jeu|Ven(dre)?|Sam(e)?|Dim(anche)?)(di)?[^sc](,)?")
	d = reFrench.ReplaceAllString(d, "")

	return d
}

func cleanMonth(d string) string {
	frenchMonthToEnglish := map[string]string{
		"Janvier":   "January",
		"Février":   "February",
		"Fevrier":   "February",
		"Fév":       "Feb",
		"Fev":       "Feb",
		"Mars":      "March",
		"Avril":     "April",
		"Mai":       "May",
		"Juin":      "June",
		"Juillet":   "July",
		"Août":      "August",
		"Aout":      "August",
		"Septembre": "September",
		"Octobre":   "October",
		"Novembre":  "November",
		"Décembre":  "December",
		"Decembre":  "December",
	}

	reEnglish := regexp.MustCompile("(?i)(Jan|Feb(r)?|Mar(ch)?|Apr(il)?|May|June|July|Aug(ust)?|Sep(t)?(em)?|Oct(o)?|Nov(em)?|Dec(em)?)(uary|ber)?")
	monthEn := reEnglish.FindString(d)

	reFrench := regexp.MustCompile("(?i)(Jan(v)?|(Fév|Fev)(r)?|Mar(s)?|Avr(il)?|Mai|Juin|Juil(let)?|(Août|Aout)|Sep(t)?(em)?|Oct(o)?|Nov(em)?|(Déc|Dec)(em)?)(ier|bre)?")
	monthFr := reFrench.FindString(d)

	// Because of the abbreviation shared for both lang, we need to compare the matches to make sure in which lang we are. For example, "Novembre" will match in English for "Novem"
	lenEn := len(monthEn)
	lenFr := len(monthFr)

	if lenFr > lenEn {
		// We are in French
		d = strings.Replace(d, monthFr, "", 1)
		month := frenchMonthToEnglish[fmt.Sprintf("%s%s", strings.ToUpper(monthFr[:1]), monthFr[1:])]
		d = fmt.Sprintf("%s %s", month, d)
	} else if lenEn > lenFr || (lenEn != 0 && lenEn == lenFr) {
		// We are in English or we matched an abbreviation that is the same in French and Eng. TODO: This could be a problem if we match in a string like "Fev/Feb 10 2019".
		d = strings.Replace(d, monthEn, "", 1)
		d = fmt.Sprintf("%s%s %s", strings.ToUpper(monthEn[:1]), monthEn[1:], d)
	}

	return d
}

func cleanHours(s string) string {
	re := regexp.MustCompile("(?i)(\\d)( ?h( [^\\w])?)(\\d)?")
	m := re.FindStringSubmatch(s)
	if m != nil {
		toReplace := m[2]
		s = strings.Replace(s, toReplace, ":", 1)
	}
	return s
}

func cleanWords(s string) string {
	s = strings.Replace(s, "À compter du ", "", 1)
	return s
}

func addYear(s string) string {
	re := regexp.MustCompile("20(19|2\\d)")
	match := re.Find([]byte(s))
	if match == nil {
		currentTime := time.Now()
		withThisYear := fmt.Sprintf("%s %d", s, currentTime.Year())
		parsedTime, err := dateparse.ParseLocal(withThisYear)
		if err == nil {
			// If there's no year but it can be parsed, it could be this year or next year.
			if parsedTime.Before(currentTime) {
				return fmt.Sprintf("%s %d", s, currentTime.Year()+1)
			}
			return withThisYear
		}
	}
	return s
}

func cleanDay(d string) string {
	d = cleanWords(d)
	d = removeDayOfTheWeek(d)
	d = trimWhiteSpaces(d, "")
	return d
}

func handleRawDateTime(day string, hour string, notes *string) (time.Time, error) {
	day = cleanDay(day)
	hour = trimWhiteSpaces(hour, "")

	dateTime := fmt.Sprintf("%s %s", day, hour)
	dateTime = cleanHours(dateTime)
	fmt.Printf("1: '%s'\n", dateTime)

	parsedTime, err := dateparse.ParseLocal(dateTime)
	if err != nil {
		dateTime = cleanMonth(dateTime)
		dateTime = trimWhiteSpaces(dateTime, "")
		dateTime = addYear(dateTime)
		fmt.Printf("2: '%s'\n", dateTime)
		parsedTime, err = dateparse.ParseLocal(dateTime)
		if err != nil {
			*notes = fmt.Sprintf("We found neither the date nor the time for this event. %s", dateTime)
			return time.Time{}, err
		}
	}

	// If the event happens at 00:00, it means that there was no time provided. We will set a default time.
	// TODO: What if the event really happened at 00:00, like New Year's...
	dateHour := parsedTime.Hour()
	if dateHour == 0 {
		*notes = "We couldn't find the appropriate time for this event. 19h is the default time applied."
		parsedTime = parsedTime.Add(time.Hour * 19)
	}
	return parsedTime, nil
}

func absoluteURLBuilder(e *colly.HTMLElement) string {
	eventURL := e.Attr("href")
	if strings.Index(eventURL, "http") == -1 {
		requestURL := e.Request.URL
		scheme := requestURL.Scheme
		baseURL := requestURL.Host
		eventURL = fmt.Sprintf("%s://%s%s", scheme, baseURL, eventURL)
	}
	return eventURL
}
