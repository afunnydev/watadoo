require("dotenv").config({ path: ".env.development" });

const needle = require("needle");
const inquirer = require("inquirer");
const Entities = require("html-entities").AllHtmlEntities;

const { prisma } = require("../../generated/prisma-client");

const entities = new Entities();

let authTokenData = process.env.WORDPRESS_BASIC_AUTH;
let buff = new Buffer(authTokenData);
let authToken = buff.toString("base64");

const postOptions = {
  json: true,
  headers: { "Authorization": "Basic " + authToken}
};

const slugify = (string) => {
  const a = "àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;";
  const b = "aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------";
  const p = new RegExp(a.split("").join("|"), "g");
  return string.toString().toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, "-and-") // Replace & with ‘and’
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

const pad = (num, size) => {
  let s = "000000000" + num;
  return s.substr(s.length-size);
};

const getWpCategoryForEvent = async (event) => {
  const categoryMap = [
    { name: "Comedy", en: 39, fr: 37 },
    { name: "Family", en: 11, fr: 19 },
    { name: "Festival", en: 35, fr: 32 },
    { name: "Food", en: 43, fr: 41 },
    { name: "Museums", en: 59, fr: 57 },
    { name: "Music", en: 30, fr: 28 },
    { name: "Sports", en: 55, fr: 53 },
    { name: "Theatre", en: 47, fr: 45 },
    { name: "Variety", en: 51, fr: 49 },
  ];

  const choice = await inquirer.prompt([
    {
      type: "list",
      name: "eventCategoryIndex",
      message: `Which category fits best with ${event.name} - at ${event.venue["nameFr"]}?`,
      default: 0,
      choices: categoryMap.map((category, index) => ({
        name: category.name,
        value: index,
        short: index
      }))
    },
  ]);
  return categoryMap[choice.eventCategoryIndex];
};

const getEventsFromWP = async (eventName, lang = "fr") => {
  if (!eventName) {throw new Error("You need an event name.");}

  const events = await needle(
    "get",
    `https://watadoo.ca/wp-json/wp/v2/search?search=${encodeURIComponent(eventName)}&lang=${lang}`,
  ).then(function({statusCode, body}) {
    if (statusCode === 200) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  return events;
};

const getEventFromWp = async (eventId) => {
  const event = await needle(
    "get",
    `https://watadoo.ca/wp-json/wp/v2/event/${eventId}`,
  ).then(function({statusCode, body}) {
    if (statusCode === 200) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  return event;
};

const checkIfEventExistInWp = async (eventName) => {
  const events = await getEventsFromWP(eventName);
  if (events && events.length > 1) {
    const choice = await inquirer.prompt([
      {
        type: "list",
        name: "eventId",
        message: `Which event from WP fits best with ${eventName}?`,
        default: events[0].id,
        choices: events.map((event, index) => ({
          name: event.title,
          value: event.id,
          short: event.id
        })).concat([{name: "None", value: "none", short: "none"},])
      },
    ]);
    if (choice.eventId != "none") {
      const wpEventId = choice.eventId;
      return await getEventFromWp(wpEventId);
    } else {
      console.log("NONE CHOSEN");
      return null;
    }
  } else if (events && events.length === 1) {
    return await getEventFromWp(events[0].id);
  }
  console.log("NO EVENT MATCHED IN WP FOR ", eventName);
  return null;
};

const importImage = async (filename, imageUrl) => {
  if (imageUrl.includes("watadoo.ca")) {
    return 35416;
  } else {
    console.log("USED URL", imageUrl);

    const file = await needle(
      "get",
      imageUrl
    ).then(function({ statusCode, body}) {
      if (statusCode === 200) { return body; }
    });

    var data = {
      file: {
        buffer       : file,
        filename     : `${filename}.jpg`,
        content_type : "application/octet-stream"
      }
    };

    const options = {
      headers: {
        "Authorization": "Basic " + authToken
      },
      multipart: true
    };

    const wpMedia = await needle(
      "post",
      "https://watadoo.ca/wp-json/wp/v2/media",
      data,
      options,
    ).then(function({statusCode, body}) {
      if (statusCode === 201) { return body; }
      console.log("IMAGE NOT CREATED", body);
    }).catch(function(err) {
      console.log(Error(err));
    });

    return wpMedia ? wpMedia.id : 35416;
  }
};

const importEvent = async (event) => {
  const slugifiedName = slugify(event.name.substring(0, 25));
  const categories = await getWpCategoryForEvent(event);
  const imageId = await importImage(slugifiedName,event.imageUrl);

  const jsDate = new Date(event.startDate);

  const startDate = `${jsDate.getFullYear()}-${pad(jsDate.getMonth()+1, 2)}-${pad(jsDate.getDate(), 2)} ${pad(jsDate.getHours(), 2)}:00:00`;

  const data = {
    title: entities.encode(event.name),
    content: event.description || "",
    akia_start_date: startDate,
    akia_end_date: startDate,
    _event_occurrence_date:`${startDate}|${startDate}`,
    _event_occurrence_last_date:`${startDate}|${startDate}`,
    status: "publish",
    achat_de_billets_lien: event.ticketUrl || "",
    featured_media: imageId,
    eventId: event.id,
    event_all_day: 0,
    source: event.source
  };

  const dataFr = {
    ...data,
    "event-category": categories.fr,
    "event-location": event.venue.wpFrId,
    region: 21,
    lang: "fr"
  };

  const dataEn = {
    ...data,
    "event-category": categories.en,
    "event-location": event.venue.wpEnId,
    region: 23,
    lang: "en"
  };

  const wpEventFr = await needle(
    "post",
    "https://watadoo.ca/wp-json/wp/v2/event",
    dataFr,
    postOptions,
  ).then(function({statusCode, body}) {
    if (statusCode === 201) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  const wpEventEn = await needle(
    "post",
    "https://watadoo.ca/wp-json/wp/v2/event",
    dataEn,
    postOptions,
  ).then(function({statusCode, body}) {
    if (statusCode === 201) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  const newEvent = await saveWpInfoInDb(event.id, wpEventFr.id, wpEventEn.id, categories.name);
  await linkEventsBetweenLang(newEvent);
};

const saveWpInfoInDb = async (eventId, wpEventFrId, wpEventEnId, eventCategory = null) => {
  let data = {
    wpFrId: wpEventFrId,
    wpEnId: wpEventEnId
  };

  if (eventCategory) {
    data.type = eventCategory;
  }

  return await prisma.updateEvent({
    data,
    where: {
      id: eventId
    }
  });
};

const linkEventsBetweenLang = async (event) => {
  const linkedEvent = await needle(
    "post",
    `https://watadoo.ca/wp-json/wp/v2/event/${event.wpFrId}?translations[en]=${event.wpEnId}`,
    null,
    postOptions,
  ).then(function({statusCode, body}) {
    if (statusCode === 200) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  console.log(linkedEvent);

  // TODO: check if events were really linked.
};

const deleteEventInWp = async (event) => {
  const linkedEvent = await needle(
    "delete",
    `https://watadoo.ca/wp-json/wp/v2/event/${event.wpFrId}`,
    null,
    postOptions,
  ).then(function({statusCode, body}) {
    console.log(body);
    if (statusCode === 200) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  // TODO: Check answer
  // Is the translation deleted?
};

const importEvents = async () => {
  const fragment = `
    fragment EventsWithVenue on Event {
      id
      name
      description
      imageUrl
      ticketUrl
      source
      startDate
      venue {
        id
        nameFr
        wpFrId
        wpEnId
      }
    }
  `;

  const events = await prisma.events({ where: { wpFrId: null, source_not: "ticketmaster", startDate_gte: new Date(), startDate_lte: new Date(Date.now() + 12096e5) } }).$fragment(fragment);

  console.log(`ONLY ${events.length} LEFT`);

  for (let i = 0; i < events.length; i++) {
    const event = await checkIfEventExistInWp(events[i].name);
    if (event) {
      await saveWpInfoInDb(events[i].id, event.translations.fr, event.translations.en);
      console.log("LINKED TO WP");
    } else {
      await importEvent(events[i]);
    }
  }
};

importEvents();
