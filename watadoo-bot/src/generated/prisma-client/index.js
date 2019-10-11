"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "Permission",
    embedded: false
  },
  {
    name: "City",
    embedded: false
  },
  {
    name: "Sex",
    embedded: false
  },
  {
    name: "Relationship",
    embedded: false
  },
  {
    name: "EventCategory",
    embedded: false
  },
  {
    name: "Notification",
    embedded: false
  },
  {
    name: "User",
    embedded: false
  },
  {
    name: "Event",
    embedded: false
  },
  {
    name: "EventOccurrence",
    embedded: false
  },
  {
    name: "Venue",
    embedded: false
  },
  {
    name: "RequestedCity",
    embedded: false
  },
  {
    name: "Search",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `${process.env["PRISMA_ENDPOINT"]}`,
  secret: `${process.env["PRISMA_SECRET"]}`
});
exports.prisma = new exports.Prisma();
