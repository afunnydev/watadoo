import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"
import { Query, Mutation } from "react-apollo"
import gql from "graphql-tag"
import { toast } from "react-toastify"

import { Columns, Column } from "bloomer"

import CategorySelect from "./CategorySelect"
import { UPDATE_EVENT_MUTATION } from "./UpdateEventButton"
import { basicEventInfoFragment } from "../lib/fragments"

const EVENTS_QUERY = gql`
  query EVENTS_QUERY($where: EventWhereInput, $orderBy: EventOrderByInput) {
    events(where: $where, orderBy: $orderBy) {
      ...BasicEventInfo
    }
  }
  ${basicEventInfoFragment}
`

const ListEvents = ({ category, where, orderBy }) => {
  let whereInput = {}
  if (where) { whereInput = { ...where } }
  if (category !== "") { whereInput.category = category }
  const categorySelected = async (updateFn, category, eventId) => {
    await updateFn({
      variables: {
        eventId,
        event: {
          category
        }
      }
    })
  }
  const onCompleted = () => toast.success("Event category saved successfully. 👍", {
    autoClose: 2000
  })
  const onError = () => toast.error("Event category couldn't save.", {
    autoClose: 2000
  })
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
        if (error) return <p>{ error.message }</p>
        if (loading) return <p>Loading...</p>
        if (!data || !data.events || !data.events.length) return <p>No events in here</p>
        return (data.events.map(event => (
          <Columns key={event.id}>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <Link href={{ pathname: "/event", query: { id: event.id } }}>
                <a>{event.name}</a>
              </Link>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <p>{new Date(event.nextOccurrenceDate).toString().split("GMT")[0]}</p>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <p>{event.source}</p>
            </Column>
            <Column isSize={{ mobile: 6, tablet: 4, desktop: 3 }}>
              <Mutation
                mutation={UPDATE_EVENT_MUTATION}
                onCompleted={onCompleted}
                onError={onError}
              >
                {(updateEvent, {loading}) => (
                  <CategorySelect
                    value={event.category}
                    onChange={async (e) => await categorySelected(updateEvent, e.target.value, event.id)}
                    loading={loading}
                  />
                )}
              </Mutation>
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
