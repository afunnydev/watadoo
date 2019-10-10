import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"
import { Query } from "react-apollo"
import gql from "graphql-tag"

import { Columns, Column } from "bloomer"

const VENUES_QUERY = gql`
  query VENUES_QUERY($where: VenueWhereInput) {
    venues(where: $where) {
      id
      nameFr
      address
      city
    }
  }
`

const ListVenues = ({ possibleDuplicate, city }) => {
  const variables = {
    where: {
      possibleDuplicate
    }
  }
  if (city && city !== "") {
    variables.where.city = city
  }
  return (
    <Query
      query={VENUES_QUERY}
      variables={variables}
      fetchPolicy="network-only"
    >
      {({ data, loading, error }) => {
        if (error) return <p>Error</p>
        if (loading) return <p>Loading...</p>
        if (!data || !data.venues || !data.venues.length) return <p>No venues in here</p>
        return (data.venues.map(venue => (
          <Columns key={venue.id}>
            <Column isSize={{ mobile: 6, tablet: 3 }}>
              <Link href={{ pathname: "/venue", query: { id: venue.id } }}>
                <a>{venue.id}</a>
              </Link>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 3 }}>
              <p>{venue.nameFr}</p>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 3 }}>
              <p>{venue.address}</p>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 3 }}>
              <p>{venue.city}</p>
            </Column>
          </Columns>
        )))
      }}
    </Query>
  )
}
ListVenues.defaultProps = {
  possibleDuplicate: false
}

ListVenues.propTypes = {
  possibleDuplicate: PropTypes.bool,
  city: PropTypes.string
}

export default ListVenues
