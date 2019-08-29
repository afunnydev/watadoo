import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"
import { Query } from "react-apollo"
import gql from "graphql-tag"

import { Columns, Column } from "bloomer"

const EVENTS_QUERY = gql`
  query EVENTS_QUERY($withoutOccurrence: Boolean!) {
    events(withoutOccurrence: $withoutOccurrence) {
      id
      name
      source
      nextOccurrenceDate
    }
  }
`

const ListEvents = ({ withoutOccurrence }) => {
  return (
    <Query
      query={EVENTS_QUERY}
      variables={{ withoutOccurrence }}
      fetchPolicy="network-only"
    >
      {({ data, loading, error }) => {
        if (error) return <p>Error</p>
        if (loading) return <p>Loading...</p>
        if (!data || !data.events || !data.events.length) return <p>No events in here</p>
        return (data.events.map(event => (
          <Columns key={event.id}>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <Link href={{ pathname: "/event", query: { id: event.id } }}>
                <a>{event.id}</a>
              </Link>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <p>{event.name}</p>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <p>{new Date(event.nextOccurrenceDate).toString().split("GMT")[0]}</p>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <p>{event.source}</p>
            </Column>
          </Columns>
        )))
      }}
    </Query>
  )
}
ListEvents.defaultProps = {
  withoutOccurrence: false
}

ListEvents.propTypes = {
  withoutOccurrence: PropTypes.bool
}

export default ListEvents
