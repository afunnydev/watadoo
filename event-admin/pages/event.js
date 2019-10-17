import React from "react"
import PropTypes from "prop-types"
import { Query } from "react-apollo"
import gql from "graphql-tag"
import { withPageRouter } from "../lib/withPageRouter"

import { occurrenceFragment, eventInfoFragment } from "../lib/fragments"

import SingleEvent from "../components/SingleEvent"

const EVENT_QUERY = gql`
  query EVENT_QUERY($id: ID!) {
    event(id: $id) {
      ...EventInfo
      occurrencesAreUnique
      isRecurring
      recurrencePattern
      occurrences {
        ...OccurrenceInfo
      }
    }
  }
  ${eventInfoFragment}
  ${occurrenceFragment}
`

const EventPage = ({ router }) => (
  <Query
    query={EVENT_QUERY}
    variables={{
      id: router.query.id
    }}
    fetchPolicy="network-only"
  >
    {({ data, loading, error }) => {
      if (error) return <p>{error}</p>
      if (loading) return <p>Loading...</p>
      if (!data || !data.event || !data.event) return <p>No event in here</p>
      return (
        <SingleEvent
          id={data.event.id}
          name={data.event.name}
          hasVenue={data.event.venue ? true : false}
        />
      )
    }}
  </Query>
)

EventPage.propTypes = {
  router: PropTypes.object.isRequired
}

export default withPageRouter(EventPage)
export { EVENT_QUERY }