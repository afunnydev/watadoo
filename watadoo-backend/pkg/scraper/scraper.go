package scraper

import (
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/gocolly/colly"

	"github.com/afunnydev/watadoo-backend/pkg/scraper/models"
)

func newCollector(domain string) *colly.Collector {
	subdomain := fmt.Sprintf("www.%s", domain)
	cacheFolder := fmt.Sprintf("cache/%s", strings.Split(domain, ".")[0])
	c := colly.NewCollector(
		// Visit only domains
		colly.AllowedDomains(domain, subdomain),

		// Cache responses to prevent multiple download of pages
		// even if the collector is restarted
		colly.CacheDir(cacheFolder),

		// To help with special characters
		colly.DetectCharset(),
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

	// c.OnRequest(func(r *colly.Request) {
	//   fmt.Println("Visiting: ", r.URL)
	// })
	c.OnError(func(r *colly.Response, err error) {
		log.Println("Request URL:", r.Request.URL, "failed with response: Error:", err)
	})

	eventDetailCollector.OnHTML(spider.EventDetailsContainerSelector, func(e *colly.HTMLElement) {
		event := extractEvent(e, spider)
		if event.Name != "" {
			events = append(events, event)
		}
	})

	// eventDetailCollector.OnRequest(func(r *colly.Request) {
	//   fmt.Println("Visiting: ", r.URL)
	// })
	eventDetailCollector.OnError(func(r *colly.Response, err error) {
		log.Println("Request URL:", r.Request.URL, "failed with response: Error:", err)
	})

	c.Visit(spider.ListURL)

	if len(events) == 0 {
		return []models.Event{}, errors.New("No events for spider: " + spider.Domain)
	}

	return events, nil
}
