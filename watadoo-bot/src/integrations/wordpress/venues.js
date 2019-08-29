require("dotenv").config({ path: "variables.env" });

const needle = require("needle");
const inquirer = require("inquirer");

const { prisma } = require("../../generated/prisma-client");

const getVenuesFromWP = async (searchTerm, lang = "fr") => {
  if (!searchTerm) {throw new Error("You need a search term.");}

  const venues = await needle(
    "get",
    `https://watadoo.ca/wp-json/wp/v2/event-location?search=${encodeURIComponent(searchTerm)}&lang=${lang}&orderby=name`,
  ).then(function({statusCode, body}) {
    if (statusCode === 200) { return body; }
  }).catch(function(err) {
    console.log(Error(err));
  });

  return venues;
};

const createVenue = async (venue, eventId) => {
  await prisma.updateEvent({
    data: {
      venue: {
        create: {
          nameFr: venue.name,
          name_EN: venue.name,
          lat: parseFloat(venue.options["google_map"].latitude),
          long: parseFloat(venue.options["google_map"].longitude),
          address: venue.options.address,
          city: venue.options.city,
          state: venue.options.state,
          zip: venue.options.zip,
          country: venue.options.country,
          wpFrId: venue.translations.fr,
          wpEnId: venue.translations.en
        }
      }
    },
    where: {
      id: eventId
    }
  });
  console.log("NEW PRISMA VENUE: ", venue.name);
};

const createVenueFromWP = async (venueName, eventId) => {
  const wpVenues = await getVenuesFromWP(venueName);
  if (wpVenues.length > 1) {
    await inquirer.prompt([
      {
        type: "list",
        name: "venueIndex",
        message: `Which venue from WP fits best with ${venueName}?`,
        default: wpVenues[0].id,
        choices: wpVenues.map((venue, index) => ({
          name: venue.name,
          value: index,
          short: index
        })).concat([{name: "None", value: "none", short: "none"},])
      },
    ]).then(async function(choice) {
      if (choice.venueIndex != "none") {
        await createVenue(wpVenues[choice.venueIndex], eventId);
      } else {
        console.log("NONE CHOSEN");
      }
    });
  } else if (wpVenues.length > 0) {
    await createVenue(wpVenues[0], eventId);
  } else {
    console.log(`${venueName}|${eventId}`);
  }
};

const assignVenueFromWpToEvents = async () => {
  const events = await prisma.events({ where: { venue: null }, first: 100 });

  console.log("EVENTS LEFT: ", events.length);

  for (let i = 0; i < events.length; i++) {
    const eventId = events[i].id;
    let venueName = events[i].venueName;
    const venueNameArray = venueName.split(" ");
    // 1. Check if we already have this event's venue in the DB
    let dbVenues = await prisma.venues({ where: { nameFr_contains: venueName } });
    if (!dbVenues.length) {
      // If there's no event, try to search the DB with the two first words.
      dbVenues = await prisma.venues({ where: { nameFr_contains: `${venueNameArray[0]} ${venueNameArray[1]}` } });
    }
    if (dbVenues.length > 0) {
      // 2. If we have a venue, assign the event to it
      if (dbVenues.length > 1) {
        await inquirer.prompt([
          {
            type: "list",
            name: "venueId",
            message: `Which venue from the DB fits best with ${venueName}?`,
            default: dbVenues[0].id,
            choices: dbVenues.map(venue => ({
              name: venue.name,
              value: venue.id,
              short: venue.id
            }))
          },
        ]).then(async function(choice) {
          await prisma.updateEvent({
            data: {
              venue: {
                connect: {
                  id: choice.venueId
                }
              }
            },
            where: {
              id: eventId
            }
          });
        });
      } else {
        await prisma.updateEvent({
          data: {
            venue: {
              connect: {
                id: dbVenues[0].id
              }
            }
          },
          where: {
            id: eventId
          }
        });
      }
    } else {
      // 3. If not, get the venue from WP, create it and link it to the event in the DB
      try {
        await createVenueFromWP(venueName, eventId);
      } catch (e) {
        console.log(`VENUE CREATION ERROR FOR ${venueName}: `, e);
      }
    }
  }
};

const linkOrCreateVenueFromWP = async () => {
  const venues = await prisma.venues({ where: { wpFrId: null }});
  console.log("Nb of venues not in the WP:", venues ? venues.length : 0);

  for (let i = 0; i < venues.length; i++) {
    const name = venues[i]["nameFr"];
    const wpVenues = await getVenuesFromWP(name);
    if (!wpVenues || !wpVenues.length) {
      console.log("No venues in WP for:", name, "You have to create it manually for now.");
      continue;
    }
    await inquirer.prompt([
      {
        type: "list",
        name: "venueIndex",
        message: `Which venue from the DB fits best with ${name}?`,
        default: wpVenues[0].id,
        choices: wpVenues.map((venue, index) => ({
          name: venue.name,
          value: index,
          short: index
        }))
      },
    ]).then(async function(choice) {
      const selectedWpVenue = wpVenues[choice.venueIndex];
      await prisma.updateVenue({
        data: {
          lat: parseFloat(selectedWpVenue.options.google_map.latitude),
          long: parseFloat(selectedWpVenue.options.google_map.longitude),
          city: selectedWpVenue.options.city,
          state: selectedWpVenue.options.state,
          zip: selectedWpVenue.options.zip,
          country: selectedWpVenue.options.country,
          wpFrId: selectedWpVenue.translations.fr,
          wpEnId: selectedWpVenue.translations.en
        },
        where: {
          id: venues[i].id
        }
      });
    });
  }
};

// Utils, can be deleted.
const updateVenues = async () => {
  const venues = await prisma.venues({ where: { nameFr_ends_with: "," } });
  for (let i = 0; i < venues.length; i++) {
    const name = venues[i]["nameFr"];
    const newNameArray = name.split(",");
    await prisma.updateVenue({
      data: {
        nameFr: newNameArray[0]
      },
      where: {
        id: venues[i].id
      }
    });
  }
};

const updateEvents = async () => {
  const events = await prisma.events({ where: {venueName_contains: "Live on"}});
  for (let i = 0; i < events.length; i++) {
    await prisma.updateEvent({
      data: {
        venue: {
          connect: {
            id: "cjx3d2nns028707298hopw4xv"
          }
        }
      },
      where: {
        id: events[i].id
      }
    });
  }
};
