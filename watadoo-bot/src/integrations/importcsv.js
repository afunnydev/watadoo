require("dotenv").config({ path: "variables.env" });
const csv = require("csvtojson");
const { prisma } = require("../generated/prisma-client");

const csvFilePath = "import-csv-example.csv";

const importCsv = async () => {
  const eventArray = await csv().fromFile(csvFilePath);
  await Promise.all(eventArray.map(event =>
    prisma.createEvent({
      name: event.name,
      description: event.description,
      link: event.eventUrl,
      imageUrl: event.imgUrl || "https://watadoo.ca/wp-content/uploads/2019/03/watadoo-icon.jpg",
      startDate: Date.parse(event.startDate) ? new Date(new Date(Date.parse(event.startDate)).setHours(19,0,0,0)).toISOString() : new Date().toISOString(),
      venueName: event.venue,
      ticketUrl: event.ticketUrl,
      source: event.source,
      city: "OTTAWA"
    })
  ));
};
importCsv();