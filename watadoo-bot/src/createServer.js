const { ApolloServer } = require("apollo-server-express");
const Mutation = require("./resolvers/Mutation");
const Query = require("./resolvers/Query");
const { importSchema } = require("graphql-import");
const { prisma } = require("./generated/prisma-client");

const typeDefs = importSchema("src/schema.graphql");

// Create the GraphQL Yoga Server

function createServer() {
  return new ApolloServer({
    typeDefs,
    resolvers: {
      Mutation,
      Query
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    context: req => ({ ...req, prisma })
  });
}

module.exports = createServer;
