package models

// HtmlSelector modelizes the way to retrieve a general value from an HTML page.
type HtmlSelector struct {
	Selector      string
	Attribute     bool
	AttributeName string
}

// DateSelector modelizes the way to retrive a date from an HTML page.
type DateSelector struct {
	Separated    bool
	DaySelector  HtmlSelector
	TimeSelector HtmlSelector
}

// PageSelector modelizes the way to retrieve the next page to parse.
type PageSelector struct {
	Selector   string
	NeededText string
}

// Spider stores all the information needed to trigger and scrape all events on a website.
type Spider struct {
	Domain                        string
	ListURL                       string
	NextPageSelector              PageSelector
	EventLinkSelector             string
	EventDetailsContainerSelector string
	EventNameSelector             HtmlSelector
	EventDescriptionSelector      HtmlSelector
	EventImageSelector            HtmlSelector
	EventStartDateSelector        DateSelector
	EventTagsSelector             string
	EventLocationSelector         HtmlSelector
	EventVenueNameSelector        HtmlSelector
	VenueNameOverride             string
	EventTicketURLSelector        HtmlSelector
	EventPriceSelector            HtmlSelector
	Notes                         string
}

// GetCronSpiders returns all the spiders that can run without human supervision
func GetCronSpiders() []Spider {
	var spiders []Spider

	cnaSpider := GetCNASpider()
	houseOfTargSpider := GetHouseOfTargSpider()
	liveOnElginSpider := GetLiveOnElginSpider()
	ovationSpider := GetOvationSpider()

	spiders = append(spiders, cnaSpider, houseOfTargSpider, liveOnElginSpider, ovationSpider)

	return spiders
}

func GetCNASpider() Spider {
	return Spider{
		Domain:                        "nac-cna.ca",
		ListURL:                       "https://nac-cna.ca/en/presents/events",
		EventLinkSelector:             "ul.fullwidth_event_list li a.detail-link[href]",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{"div#event_wrapper .event_title_block .title h1", false, ""},
		EventDescriptionSelector:      HtmlSelector{"div#event_wrapper .event_main_copy", false, ""},
		EventImageSelector:            HtmlSelector{"meta[name=thumbnail]", true, "content"},
		EventStartDateSelector: DateSelector{
			Separated:    true,
			DaySelector:  HtmlSelector{".event_title_block .datetime .event_date .nac-item-date", false, ""},
			TimeSelector: HtmlSelector{".event_title_block .datetime .event_time .nac-item-time", false, ""}},
		EventTagsSelector:      "div#event_wrapper .event_genre_categories span.category",
		EventVenueNameSelector: HtmlSelector{".event_title_block .datetime .event_venue span.venue a", false, ""},
		EventLocationSelector:  HtmlSelector{".event_title_block .datetime .event_venue span.venue_address a", false, ""},
		EventTicketURLSelector: HtmlSelector{".event_sales_original #sales_module div.pane a.bttn", true, "href"},
		EventPriceSelector:     HtmlSelector{".event_sales_original #sales_module .panel_title .panel_subtitle", false, ""},
	}
}

func GetHouseOfTargSpider() Spider {
	return Spider{
		Domain:                        "houseoftarg.com",
		ListURL:                       "http://www.houseoftarg.com/concert-listings-events/",
		EventLinkSelector:             "article.eventlist-event .eventlist-title a.eventlist-title-link[href]",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{"h1.eventitem-title", false, ""},
		EventDescriptionSelector:      HtmlSelector{"div.eventitem-column-content .sqs-block-html .sqs-block-content", false, ""},
		EventImageSelector:            HtmlSelector{".image-block-outer-wrapper img.thumb-image", true, "data-src"},
		EventStartDateSelector: DateSelector{
			Separated:    true,
			DaySelector:  HtmlSelector{".event-meta-date-time-container .eventitem-meta-date time.event-date", true, "datetime"},
			TimeSelector: HtmlSelector{".event-meta-date-time-container .eventitem-meta-time time.event-time-12hr-start", false, ""},
		},
		VenueNameOverride: "House of TARG",
	}
}

func GetOvationSpider() Spider {
	return Spider{
		Domain:                        "ovation.qc.ca",
		ListURL:                       "https://www.ovation.qc.ca/liste.asp?CodeVille=000018&Lang=FR",
		NextPageSelector:              PageSelector{".box-content ul.pagination li:last-of-type a:not(.active)[href]", ">"},
		EventLinkSelector:             ".events-list .ImprimableEnsemble a.more-info[href]",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{"#titreChoixSpecDate h1", false, ""},
		EventDescriptionSelector:      HtmlSelector{"#TextePresentation_complet", false, ""},
		EventImageSelector:            HtmlSelector{"meta[property='og:image']", true, "content"},
		EventStartDateSelector: DateSelector{
			Separated:   false,
			DaySelector: HtmlSelector{"#titreChoixSpecDate h2", false, ""},
		},
		EventVenueNameSelector: HtmlSelector{"#titreChoixSpecDate h4 a", false, ""},
	}
}

func GetLiveOnElginSpider() Spider {
	return Spider{
		Domain:                        "liveonelgin.com",
		ListURL:                       "https://www.liveonelgin.com/collections/shows",
		EventLinkSelector:             ".container.main.content > .twelve.columns > .four.columns > a[href]",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{"meta[property='og:title']", true, "content"},
		EventDescriptionSelector:      HtmlSelector{".section.product_section .seven.columns div.description", false, ""},
		EventImageSelector:            HtmlSelector{"meta[property='og:image']", true, "content"},
		EventStartDateSelector: DateSelector{
			Separated:   false,
			DaySelector: HtmlSelector{".section.product_section .seven.columns p.vendor span", false, ""},
		},
		VenueNameOverride:  "Live On Elgin",
		EventPriceSelector: HtmlSelector{".section.product_section .seven.columns p.modal_price span[itemprop=price]", true, "content"},
	}
}

func GetTodoCanadaSpider() Spider {
	return Spider{
		Domain:                        "todocanada.ca",
		ListURL:                       "https://www.todocanada.ca/city/ottawa/events/",
		EventLinkSelector:             ".search_result_listing .post h2.entry-title a[href]",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{".entry-header-title h1.entry-title", false, ""},
		EventDescriptionSelector:      HtmlSelector{".event-description .entry-content", false, ""},
		EventImageSelector:            HtmlSelector{"meta[property='og:image']", true, "content"},
		EventStartDateSelector: DateSelector{
			Separated:   false,
			DaySelector: HtmlSelector{".date #frontend_date_st_date", false, ""},
		},
		EventVenueNameSelector: HtmlSelector{".address span.frontend_address", false, ""},
		// This same field contains both the venue name and the location.
		EventLocationSelector: HtmlSelector{".address span.frontend_address", false, ""},
		EventPriceSelector:    HtmlSelector{".fees span", false, ""},
	}
}

func GetOttawaTourismSpider() Spider {
	return Spider{
		Domain:                        "ottawatourism.ca",
		ListURL:                       "https://www.ottawatourism.ca/see-and-do/festivals-events/",
		EventLinkSelector:             ".events-slider .link-tile a.link-tile-img[href]",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{"h1.content-title span", false, ""},
		EventDescriptionSelector:      HtmlSelector{".content-body-expander .content-body-inner", false, ""},
		EventImageSelector:            HtmlSelector{"meta[property='og:image']", true, "content"},
		EventStartDateSelector: DateSelector{
			// It's actually separated but the time format is... rough: 9am to 7pm
			Separated:   false,
			DaySelector: HtmlSelector{".content-right .events-link-info span.info-item.calendar", false, ""},
		},
		EventVenueNameSelector: HtmlSelector{".content-right .events-link-info span.info-item.address", false, ""},
		// This same field contains both the venue name and the location.
		EventLocationSelector:  HtmlSelector{".content-right .events-link-info span.info-item.address", false, ""},
		EventTicketURLSelector: HtmlSelector{".content-right .events-link-info span.info-item.website a", true, "href"},
		EventTagsSelector:      ".content-tags a",
	}
}

func GetAleaSpider() Spider {
	return Spider{
		Domain:                        "alea.electrostub.com",
		ListURL:                       "https://alea.electrostub.com/eventlist.cfm",
		EventLinkSelector:             "ul.showList > li .infocol h3 a[href]",
		EventDetailsContainerSelector: "html",
	}
}

func GetTourismeOutaouaisSpider() Spider {
	return Spider{
		Domain:                        "tourismeoutaouais.com",
		ListURL:                       "",
		EventLinkSelector:             "",
		EventDetailsContainerSelector: "html",
		EventNameSelector:             HtmlSelector{"div.featured-content-container h1.mbot-0", false, ""},
		EventDescriptionSelector:      HtmlSelector{"div.featured-content-container p:nth-of-type(0n + 2)", false, ""},
		EventImageSelector:            HtmlSelector{"div.featured-img-container div.vitrine-img", true, "style"},
		EventStartDateSelector: DateSelector{
			Separated:   false,
			DaySelector: HtmlSelector{"div.featured-content-container div.h1.small.mbot-20", false, ""},
		},
		EventVenueNameSelector: HtmlSelector{"div.featured-content-container h3.light", false, ""},
		// This same field contains both the venue name and the location.
		EventLocationSelector:  HtmlSelector{"div.featured-content-container p b", false, ""},
		EventTicketURLSelector: HtmlSelector{"div.featured-content-container div.featured-content-cta a", true, "href"},
	}
}

func GetAllEventsSpider() Spider {
	return Spider{
		Domain:                        "allevents.in",
		ListURL:                       "https://allevents.in/ottawa/all",
		NextPageSelector:              PageSelector{".pagination ul li a[href]", "Next"},
		EventLinkSelector:             ".event-item h3 a[href]",
		EventDetailsContainerSelector: "#event-detail-fade",
		EventNameSelector:             HtmlSelector{"h1.overlay-h1", false, ""},
		EventDescriptionSelector:      HtmlSelector{".event-description-html", false, ""},
		EventImageSelector:            HtmlSelector{".event-thumb-parent img", true, "src"},
		EventTagsSelector:             ".small-event-list a",
		EventLocationSelector:         HtmlSelector{"p .full-venue", false, ""},
	}
}
