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
      nameFr
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
    importNotes
    category
    possibleDuplicate
    recurrencePatternChanged @client
  }
`

const basicEventInfoFragment = gql`
  fragment BasicEventInfo on Event {
    id
    name
    source
    nextOccurrenceDate
    category
  }
`

export { occurrenceFragment, eventInfoFragment, basicEventInfoFragment }