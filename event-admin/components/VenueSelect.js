import React from "react"
import PropTypes from "prop-types"
import { Query } from "react-apollo"
import gql from "graphql-tag"

import { Control, Select } from "bloomer"

const VENUES_QUERY = gql`
  query VENUES_QUERY {
    venues {
      id
      nameFr
    }
  }
`

const VenueSelect = ({ value, onChange }) => (
  <Query
    query={VENUES_QUERY}
  >
    {({ data, loading, error }) => {
      if (error) return <p>Can&#39;t load venues...</p>
      if (loading) return <p>Loading venues...</p>
      if (!data || !data.venues || !data.venues.length) return <p>Can&#39;t load venues</p>
      return (
        <Control>
          <Select value={value} onChange={onChange}>
            {data.venues.map(venue => (
              <option value={venue.id} key={venue.id}>{venue.nameFr}</option>
            ))}
          </Select>
        </Control>
      )
    }}
  </Query>
)

VenueSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default VenueSelect