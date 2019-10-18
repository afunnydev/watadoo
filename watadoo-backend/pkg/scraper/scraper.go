package scraper

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gocolly/colly"
	// "github.com/gocolly/colly/debug"
	"github.com/araddon/dateparse"

	"github.com/afunnydev/watadoo/watadoo-backend/pkg/scraper/models"
)

func newCollector(domain string) *colly.Collector {
	subdomain := fmt.Sprintf("www.%s", domain)
	mobileDomain := fmt.Sprintf("m.%s", domain)
	cacheFolder := fmt.Sprintf("cache/%s", strings.Split(domain, ".")[0])
	c := colly.NewCollector(
		// colly.Debugger(&debug.LogDebugger{}),
		// Visit only domains
		colly.AllowedDomains(domain, subdomain, mobileDomain),

		// Cache responses to prevent multiple download of pages
		// even if the collector is restarted
		colly.CacheDir(cacheFolder),

		// To help with special characters
		colly.DetectCharset(),

		// Set user agent
		colly.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"),
	)

	return c
}

// FetchListPage is used to fetch all events from a usual listing site.
func FetchListPage(spider models.Spider) ([]models.Event, error) {
	c := newCollector(spider.Domain)
	eventDetailCollector := c.Clone()

	var events []models.Event

	// Find and visit all events links
	c.OnHTML(spider.EventLinkSelector, func(e *colly.HTMLElement) {
		eventDetailCollector.Visit(absoluteURLBuilder(e))
	})

	// Find the next page and visit it
	if spider.NextPageSelector.Selector != "" {
		c.OnHTML(spider.NextPageSelector.Selector, func(e *colly.HTMLElement) {
			if spider.NextPageSelector.NeededText != "" {
				if e.Text != spider.NextPageSelector.NeededText {
					return
				}
				e.Request.Visit(e.Attr("href"))
			}
		})
	}

	c.OnError(func(r *colly.Response, err error) {
		log.Println("Request URL:", r.Request.URL, "failed with response: Error:", err)
	})

	eventDetailCollector.OnHTML(spider.EventDetailsContainerSelector, func(e *colly.HTMLElement) {
		event := extractEvent(e, spider)
		if event.Name != "" {
			events = append(events, event)
		}
	})

	eventDetailCollector.OnError(func(r *colly.Response, err error) {
		log.Println("Request URL:", r.Request.URL, "failed with response: Error:", err)
	})

	c.Visit(spider.ListURL)

	if len(events) == 0 {
		return []models.Event{}, errors.New("No events for spider: " + spider.Domain)
	}

	return events, nil
}

type toResponse struct {
	Data    Data `json:"data"`
	Success bool `json:"success"`
}

type Data struct {
	CurrentPage int      `json:"currentPage"`
	More        bool     `json:"more"`
	Items       []string `json:"items"`
	PageCount   int      `json:"pageCount"`
	PageSize    int      `json:"pageSize"`
	TotalCount  int      `json:"totalCount"`
}

// FetchTourismeOutaouais gets the events from the Tourisme Outaouais site.
func FetchTourismeOutaouais() ([]models.Event, error) {
	c := newCollector("tourismeoutaouais.com")

	var events []models.Event

	URL := "https://www.tourismeoutaouais.com/wp-admin/admin-ajax.php?_t=1567102613418&lang=fr&isajax=1&action=things-todo-widget-grid"
	var response toResponse

	c.OnResponse(func(r *colly.Response) {
		json.Unmarshal(r.Body, &response)
	})

	err := c.Post(URL, generatePostData("0"))

	if err != nil {
		fmt.Println(err)
		return events, err
	}

	totalPages := response.Data.PageCount
	re := regexp.MustCompile(`https:\/\/www.tourismeoutaouais.com\/evenements\/(\w+-?)+`)
	eventDetailCollector := c.Clone()
	spider := models.GetTourismeOutaouaisSpider()

	eventDetailCollector.OnHTML(spider.EventDetailsContainerSelector, func(e *colly.HTMLElement) {
		event := extractEvent(e, spider)
		if event.Name != "" {
			events = append(events, event)
		}
	})

	eventDetailCollector.OnRequest(func(r *colly.Request) {
		fmt.Println("Visiting: ", r.URL)
	})

	eventDetailCollector.OnError(func(r *colly.Response, err error) {
		log.Println("Request URL:", r.Request.URL, "failed with response: Error:", err)
	})

	for i := 0; i < totalPages+1; i++ {
		_ = c.Post(URL, generatePostData(strconv.Itoa(i)))
		if response.Success {
			for _, post := range response.Data.Items {
				eventDetailCollector.Visit(re.FindString(post))
			}
		}
	}

	return events, nil
}

func generatePostData(page string) map[string]string {
	return map[string]string{
		"page":   page,
		"period": "yearround",
		"type":   "event",
		"isHome": "false",
	}
}

// FetchFacebook gets the events from the Tourisme Outaouais site.
func FetchFacebook(url string) ([]models.Event, error) {
	c := newCollector("facebook.com")
	var events []models.Event

	c.OnRequest(func(r *colly.Request) {
		fmt.Println("Visiting", r.URL.String())
	})

	c.OnHTML("a", func(e *colly.HTMLElement) {
		label := e.Attr("aria-label")
		if strings.Contains(label, "Afficher les") || strings.Contains(label, "View event details") {
			event, err := fetchFacebookEvent(fmt.Sprintf("https://m.facebook.com%s", e.Attr("href")))
			if err != nil {
				fmt.Println(err)
				return
			}
			events = append(events, *event)
		}
	})

	c.OnError(func(r *colly.Response, err error) {
		fmt.Println(r.StatusCode)
		fmt.Println(err)
	})

	c.Visit(url)

	return events, nil
}

type facebookEvent struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`
	StartDate   string `json:"startDate"`
	EndDate     string `json:"endDate"`
	URL         string `json:"url"`
	Location    struct {
		Name    string `json:"name"`
		Address struct {
			Country       string `json:"addressCountry"`
			Locality      string `json:"addressLocality"`
			PostalCode    string `json:"postalCode"`
			StreetAddress string `json:"streetAddress"`
		} `json:"address"`
	} `json:"location"`
}

func fetchFacebookEvent(url string) (*models.Event, error) {
	c := newCollector("facebook.com")
	var event facebookEvent

	c.OnHTML("script", func(e *colly.HTMLElement) {
		if e.Attr("type") == "application/ld+json" {
			json.Unmarshal([]byte(e.Text), &event)
		}
	})

	c.OnError(func(r *colly.Response, err error) {
		fmt.Println(r.StatusCode)
		fmt.Println(err)
	})

	c.Visit(url)

	if event.Name == "" || event.URL == "" {
		fmt.Println("Event", event)
		return nil, fmt.Errorf("couldn't find the event informations for url: %s", url)
	}

	t, err := dateparse.ParseLocal(event.StartDate)
	var startDate time.Time
	var notes string
	if err == nil {
		startDate = t
		now := time.Now()
		if startDate.Before(now) {
			return nil, fmt.Errorf("old event for %s", event.Name)
		}
	} else {
		notes = fmt.Sprintf("Couldn't find appropriate time with %s", event.StartDate)
	}

	return &models.Event{
		Name:        event.Name,
		Description: event.Description,
		Link:        event.URL,
		Image:       event.Image,
		StartDate:   startDate,
		VenueName:   event.Location.Name,
		Location:    fmt.Sprintf("%s, %s, %s, %s", event.Location.Address.StreetAddress, event.Location.Address.Locality, event.Location.Address.Country, event.Location.Address.PostalCode),
		Source:      "facebook",
		Notes:       notes,
	}, nil
}
