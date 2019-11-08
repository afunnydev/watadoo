import withApollo from "next-with-apollo"
import ApolloClient from "apollo-boost"
import gql from "graphql-tag"

import { occurrenceFragment } from "./fragments"
import generateID from "./generateID"

function createClient({ headers }) {
  return new ApolloClient({
    uri: process.env.REACT_APP_GRAPHQL_ENDPOINT,
    request: operation => {
      operation.setContext({
        fetchOptions: {
          credentials: "include"
        },
        headers
      })
    },
    typeDefs: gql`
      extend type Event {
        recurrencePatternChanged: Boolean!
      }
      extend type EventOccurrence {
        isNew: Boolean!
        toDelete: Boolean!
      }
    `,
    resolvers: {
      Event: {
        recurrencePatternChanged: (event) => event.recurrencePatternChanged || false
      },
      EventOccurrence: {
        isNew: (occurrence) => occurrence.isNew || false,
        toDelete: (occurrence) => occurrence.toDelete || false
      },
      Query: {
        occurrence: (_, { id }, { cache, getCacheKey }) => {
          const key = getCacheKey({ __typename: "EventOccurrence", id })
          return cache.readFragment({ fragment: occurrenceFragment, id: key })
        }
      },
      Mutation: {
        addOccurrence: (_, { eventId }, { cache, getCacheKey }) => {
          const id = getCacheKey({ __typename: "Event", id: eventId })
          const fragment = gql`
          fragment EventWithOccurrences on Event {
              name
              imageUrl
              shortDescription
              occurrences {
                ...OccurrenceInfo
              }
            }
            ${occurrenceFragment}
          `
          const query = cache.readFragment({ fragment, fragmentName: "EventWithOccurrences", id })
          const nbOfOccurrences = query.occurrences ? query.occurrences.length : 0
          const newId = generateID()
          const newOccurrence = {
            id: newId,
            name: query.name,
            description: query.shortDescription,
            startDate: new Date().toISOString(),
            endDate: null,
            imageUrl: query.imageUrl,
            isNew: true,
            toDelete: false,
            __typename: "EventOccurrence"
          }
          const data = {
            occurrences: nbOfOccurrences ? [newOccurrence, ...query.occurrences,] : [newOccurrence,]
          }
          cache.writeData({ id, data })
          return newOccurrence
        },
        removeOccurrence: (_root, { occurrenceId }, { cache, getCacheKey }) => {
          const id = getCacheKey({ __typename: "EventOccurrence", id: occurrenceId })
          const query = cache.readFragment({ fragment: occurrenceFragment, id })
          query.toDelete = true
          cache.writeData({ id, data: query })
          return query
        }
      }
    }
  })
}

export default withApollo(createClient)
