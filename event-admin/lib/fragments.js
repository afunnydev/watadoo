import gql from "graphql-tag"

const occurrenceFragment = gql`
  fragment OccurrenceInfo on EventOccurrence {
    id
    name
    description
    startDate
    endDate
    imageUrl
    isNew @client
    toDelete @client
  }
`

const eventInfoFragment = gql`
  fragment EventInfo on Event {
    id
    name
    shortDescription
    description
    venue {
      id
      lat
      long
      city
    }
    ticketUrl
    imageUrl
    source
    wpFrId
    wpEnId
    link
    recurrencePatternChanged @client
  }
`

export { occurrenceFragment, eventInfoFragment }