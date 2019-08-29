const daysOfTheWeek = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",];

const monthsOfTheYear = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre",];

const getNextDayOfWeek = (date, dayOfWeek, evening = false) => {
  // TODO: need to check that date and dayOfWeek are valid
  // TODO: Depending on the machine on which the code runs, the time will not always be the same. On heroku live server, this sets the end of the day to 7:59PM our time....
  let resultDate = new Date(evening ? date.setHours(17,0,0,0) : date.setHours(23,59,59,999));

  resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

  return resultDate;
};

exports.findEventMoment = (date, timePeriod, datePeriod, datePeriodString = "") => {
  let moment = {};
  const now = new Date();

  if (datePeriod) {
    const periodStart = new Date(datePeriod.startDate);
    const periodEnd = new Date(datePeriod.endDate);
    // If it's a weekend, we need to handle the query because Dialogflow doesn't get the correct date. TODO: Depending on the timezone of the user and/or of the machine on which the code runs, this does not always represent the weekend.
    if (periodStart.getDay() == 6 && (periodEnd.getDay() == 0 || periodEnd.getDay() == 1 )) {
      // We sometime get the previous weekend. Check if start date is before next sunday, if so he is speaking about this weekend.
      const nextSunday = getNextDayOfWeek(now, 0);
      const nextFriday = getNextDayOfWeek(now, 5, true);
      if (periodStart < nextSunday) {
        // If we are passed friday, he can still ask what to do this weekend.
        moment.start = nextFriday > nextSunday ? now : nextFriday;
        moment.end = nextSunday;
        moment.string = "en fin de semaine";
      } else {
        moment.start = datePeriod.startDate;
        moment.end = datePeriod.endDate;
        moment.string = datePeriodString;
      }
    } else {
      moment.start = datePeriod.startDate;
      moment.end = datePeriod.endDate;
      moment.string = datePeriodString;
    }
  } else if (date) {
    const comparedDate = new Date(date);
    const todayNb = now.getDate();
    const comparedNb = comparedDate.getDate();
    if (todayNb === comparedNb) {
      moment.string = "aujourd'hui";
    } else if (todayNb + 1 === comparedNb) {
      moment.string = "demain";
    } else {
      const comparedDay = comparedDate.getDay();
      const comparedMonth = comparedDate.getMonth();
      moment.string = `${daysOfTheWeek[comparedDay]} le ${comparedNb} ${monthsOfTheYear[comparedMonth]}`;
    }

    if (timePeriod) {
      const start = timePeriod.startTime;
      if (start.includes("5:00:00")) {
        moment.start = comparedDate.setHours(5,0,0,0);
        moment.end = comparedDate.setHours(11,59,59,999);
        moment.string += " en matinée";
      } else {
        moment.start = comparedDate.setHours(17,0,0,0);
        moment.end = comparedDate.setHours(23,59,59,999);
        moment.string += " en soirée";
      }
    } else {
      moment.start = comparedDate.setHours(0,0,0,0);
      moment.end = comparedDate.setHours(23,59,59,999);
    }

  } else {
    // If there's only a time period, the only possible queries are 'ce soir' and 'ce matin'.
    moment.start = now.setHours(17,0,0,0);
    moment.end = now.setHours(23,59,59,999);
    moment.string = "ce soir";
  }

  const startMoment = new Date(moment.start);
  // We need to make sure we don't suggest already started events.
  const startDate = now > startMoment ? now : startMoment;
  return {
    start: startDate,
    end: new Date(moment.end),
    string: moment.string
  };
};

exports.generateCard = (eventOccurrence, userId = "") => ({
  "title": eventOccurrence.name,
  "image_url": eventOccurrence.imageUrl,
  "subtitle": eventOccurrence.description,
  "default_action": {
    "type": "web_url",
    "url": `https://evenements.watadoo.ca?id=${eventOccurrence.event.id}&user=${userId}`,
    "webview_height_ratio": "compact"
  },
  "buttons":[
    {
      "type": "web_url",
      "url": `https://evenements.watadoo.ca?id=${eventOccurrence.event.id}&user=${userId}`,
      "title": "En savoir plus",
      "webview_height_ratio": "compact"
    },
    {
      "type": "element_share",
      "share_contents": {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [
              {
                "title": eventOccurrence.name,
                "subtitle": eventOccurrence.description,
                "image_url": eventOccurrence.imageUrl,
                "default_action": {
                  "type": "web_url",
                  "url": `https://evenements.watadoo.ca?id=${eventOccurrence.event.id}`,
                  "webview_height_ratio": "compact"
                },
                "buttons": [
                  {
                    "type": "web_url",
                    "url": `https://evenements.watadoo.ca?id=${eventOccurrence.event.id}`,
                    "title": "En savoir plus",
                    "webview_height_ratio": "compact"
                  },
                ]
              },
            ]
          }
        }
      }
    },
  ]
});