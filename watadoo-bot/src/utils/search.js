const daysOfTheWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",];
const monthsOfTheYear = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",];

const getNextDayOfWeek = (date, dayOfWeek, evening = false) => {
  // TODO: need to check that date and dayOfWeek are valid
  // TODO: Depending on the machine on which the code runs, the time will not always be the same. On heroku live server, this sets the end of the day to 7:59PM our time....
  let resultDate = new Date(evening ? date.setHours(17,0,0,0) : date.setHours(23,59,59,999));

  resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

  return resultDate;
};

exports.findEventMoment = (polyglot, date, timePeriod, datePeriod, datePeriodString = "") => {
  let moment = {};
  const now = new Date();

  if (datePeriod) {
    const periodStart = new Date(datePeriod.startDate.stringValue);
    const periodEnd = new Date(datePeriod.endDate.stringValue);
    // If it's a weekend, we need to handle the query because Dialogflow doesn't get the correct date. TODO: Depending on the timezone of the user and/or of the machine on which the code runs, this does not always represent the weekend.
    if (periodStart.getDay() == 6 && (periodEnd.getDay() == 0 || periodEnd.getDay() == 1 )) {
      // We sometime get the previous weekend. Check if start date is before next sunday, if so he is speaking about this weekend.
      const nextSunday = getNextDayOfWeek(now, 0);
      const nextFriday = getNextDayOfWeek(now, 5, true);
      if (periodStart < nextSunday) {
        // If we are passed friday, he can still ask what to do this weekend.
        moment.start = nextFriday > nextSunday ? now : nextFriday;
        moment.end = nextSunday;
        moment.string = polyglot.t("en fin de semaine");
      } else {
        moment.start = datePeriod.startDate.stringValue;
        moment.end = datePeriod.endDate.stringValue;
        moment.string = datePeriodString.toLowerCase();
      }
    } else {
      moment.start = datePeriod.startDate.stringValue;
      moment.end = datePeriod.endDate.stringValue;
      moment.string = datePeriodString.toLowerCase();
    }
  } else if (date) {
    const comparedDate = new Date(date);
    const todayNb = now.getDate();
    const comparedNb = comparedDate.getDate();
    if (todayNb === comparedNb) {
      moment.string = polyglot.t("aujourd'hui");
    } else if (todayNb + 1 === comparedNb) {
      moment.string = polyglot.t("demain");
    } else {
      const comparedDay = comparedDate.getDay();
      const comparedMonth = comparedDate.getMonth();
      moment.string = polyglot.t("date-confirmation", {
        dayName: polyglot.t(daysOfTheWeek[comparedDay]),
        day: comparedNb,
        month: polyglot.t(monthsOfTheYear[comparedMonth])
      });
    }

    if (timePeriod) {
      const start = timePeriod.startTime.stringValue;
      if (start.includes("5:00:00")) {
        moment.start = comparedDate.setHours(5,0,0,0);
        moment.end = comparedDate.setHours(11,59,59,999);
        moment.string += polyglot.t(" en matinée");
      } else {
        moment.start = comparedDate.setHours(17,0,0,0);
        moment.end = comparedDate.setHours(23,59,59,999);
        moment.string += polyglot.t(" en soirée");
      }
    } else {
      moment.start = comparedDate.setHours(0,0,0,0);
      moment.end = comparedDate.setHours(23,59,59,999);
    }

  } else {
    // If there's only a time period, the only possible queries are 'ce soir' and 'ce matin'.
    moment.start = now.setHours(17,0,0,0);
    moment.end = now.setHours(23,59,59,999);
    moment.string = polyglot.t("ce soir");
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

exports.generateCard = (eventOccurrence, userId = "", polyglot) => ({
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
      "title": polyglot.t("En savoir plus"),
      "webview_height_ratio": "compact"
    },
  ]
});