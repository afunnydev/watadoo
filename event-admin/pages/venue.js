import React from "react"
import PropTypes from "prop-types"
import { Query } from "react-apollo"
import gql from "graphql-tag"

import SingleVenue from "../components/SingleVenue"
import { withPageRouter } from "../lib/withPageRouter"

const VENUE_QUERY = gql`
  query VENUE_QUERY($id: ID!) {
    venue(id: $id) {
      id
      nameFr
      address
      city
      lat
      long
      events {
        id
        name
        nextOccurrenceDate
      }
    }
  }
`

const VenuePage = ({ router }) => (
  <Query
    query={VENUE_QUERY}
    variables={{
      id: router.query.id
    }}
  >
    {({ data, loading, error, client }) => {
      if (error) return <p>Error</p>
      if (loading) return <p>Loading...</p>
      if (!data || !data.venue) return <p>No venue in here</p>
      return (
        <SingleVenue venue={data.venue} client={client} />
      )
    }}
  </Query>
)

VenuePage.propTypes = {
  router: PropTypes.object.isRequired
}

export default withPageRouter(VenuePage)
export { VENUE_QUERY }