import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"
import { Query } from "react-apollo"
import gql from "graphql-tag"

import { Columns, Column } from "bloomer"

const EVENTS_QUERY = gql`
  query EVENTS_QUERY($where: EventWhereInput, $orderBy: EventOrderByInput) {
    events(where: $where, orderBy: $orderBy) {
      id
      name
      source
      nextOccurrenceDate
    }
  }
`

const ListEvents = ({ category, where, orderBy }) => {
  let whereInput = {}
  if (where) { whereInput = { ...where } }
  if (category !== "") { whereInput.category = category }
  return (
    <Query
      query={EVENTS_QUERY}
      variables={{
        where: Object.entries(whereInput).length !== 0 ? whereInput : null,
        orderBy
      }}
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
  category: "",
  where: null,
  orderBy: "nextOccurrenceDate_ASC"
}

ListEvents.propTypes = {
  category: PropTypes.string,
  where: PropTypes.object,
  orderBy: PropTypes.string
}

export default ListEvents
