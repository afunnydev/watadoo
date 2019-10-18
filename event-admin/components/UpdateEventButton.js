/* eslint-disable no-console */
import React from "react"
import PropTypes from "prop-types"
import { Mutation, withApollo } from "react-apollo"
import gql from "graphql-tag"
import { toast } from "react-toastify"

import SaveButton from "./styles/SaveButton"
import { EVENT_QUERY } from "../pages/event.js"
import { basicEventInfoFragment } from "../lib/fragments.js"

const UPDATE_EVENT_MUTATION = gql`
  mutation UPDATE_EVENT_MUTATION($eventId: ID!, $event: EventUpdateInput!) {
    updateEvent(eventId: $eventId, event: $event) {
      ...BasicEventInfo
    }
  }
  ${basicEventInfoFragment}
`

const UpdateEventButton = ({ eventId, newVenueId, client }) => {
  const createOccurrencesFromRecurring = (event) => {
    let toCreate = []
    const recurrencePatternObject = JSON.parse(event.recurrencePattern)
    const eventDefault = {
      name: event.name,
      description: event.shortDescription ? event.shortDescription : event.description ? event.description.replace(/(\r\n|\n|\r)/gm, "").replace(/<\/?[^>]+(>|$)/g, "").substr(0, 70) : null,
      imageUrl: event.imageUrl,
      lat: event.venue.lat,
      long: event.venue.long,
      city: event.venue.city
    }
    for (var key in recurrencePatternObject) {
      const frequency = recurrencePatternObject[key]["frequency"]
      if (frequency !== "never") {
        let nbDays = 7
        if (frequency === "bimonthly") {
          nbDays = 14
        }
        for (let i = 0; i < 28 / nbDays; i++) {
          let startDate = new Date(recurrencePatternObject[key]["nextStartDate"])
          let endDate = new Date(recurrencePatternObject[key]["nextEndDate"])
          startDate.setDate(startDate.getDate() + (nbDays * i))
          endDate.setDate(endDate.getDate() + (nbDays * i))
          toCreate.push({
            ...eventDefault,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })
        }
      }
    }
    return toCreate
  }
  const formatOccurrences = (occurrences, event) => {
    let recurrenceObject = {
      create: [],
      update: [],
      delete: []
    }
    occurrences.map(occurrence => {
      occurrence = Object.assign({}, occurrence)
      const isNew = occurrence.isNew
      const toDelete = occurrence.toDelete
      delete occurrence.isNew
      delete occurrence.toDelete
      delete occurrence.__typename

      if (!toDelete) {
        const occurrenceId = occurrence.id
        delete occurrence.id
        let data = { ...occurrence }
        if (!event.occurrencesAreUnique) {
          data.name = event.name
          data.description = event.shortDescription ? event.shortDescription : event.description ? event.description.replace(/(\r\n|\n|\r)/gm, "").replace(/<\/?[^>]+(>|$)/g, "").substr(0, 70) : null
          data.imageUrl = event.imageUrl
        }
        data.lat = event.venue.lat
        data.long = event.venue.long
        data.city = event.venue.city

        if (!isNew) {
          recurrenceObject.update.push({ data, where: { id: occurrenceId }})
        } else {
          recurrenceObject.create.push(data)
        }
      } else if (!isNew && toDelete) {
        recurrenceObject.delete.push({ id: occurrence.id })
      }
    })
    return recurrenceObject
  }
  const saveAction = async (updateEvent) => {
    // Note that readQuery will ALWAYS read from the cache, and not from the server. It throws an error if the data is not in the cache.
    let query
    try {
      query = await client.readQuery({
        query: EVENT_QUERY,
        variables: {
          id: eventId
        }
      })
    } catch(e) {
      console.log(e)
      return toast.error("This event couldn't save...")
    }
    const event = Object.assign({}, query.event)
    delete event.id
    delete event.__typename

    if (event.shortDescription && event.shortDescription.length > 70) {
      return toast.error("The short description is maximum 70 characters. Please adjust it or remove it completely. It's not mandatory.")
    }

    if (!(event.venue && event.venue.id) && !newVenueId ) {
      return toast.error("Please select a venue before saving.")
    }

    // If the event is recurring, we pass the pattern so that the backend can manage the occurrences. We delete all occurrences, because none should be managed by anything else than the pattern.
    if (event.isRecurring) {
      delete event.occurrences

      if (event.recurrencePatternChanged) {
        let confirm = window.confirm("This action will DELETE ALL the occurrences for this event, and generate new ones based on the recurrence pattern. Are you sure you want to do this?")
        if (confirm) {
          const create = createOccurrencesFromRecurring(event)
          const now = new Date()
          event.occurrences = {
            create,
            deleteMany: [{ id_not: null, createdAt_lt: now.toISOString() },]
          }
        } else {
          return false
        }
      } else {
        delete event.recurrencePattern
      }
    } else {
      delete event.recurrencePattern
    }
    delete event.recurrencePatternChanged

    // If the event is recurring, the occurrences will already be deleted.
    if (event.occurrences && event.occurrences.length) {
      const occurrences = [...event.occurrences,]
      delete event.occurrences

      event.occurrences = formatOccurrences(occurrences, event)
    }

    // We need the event.venue on the previous step, so don't delete it before.
    delete event.venue
    if (newVenueId) {
      // If there's a new venue selected for this event, we can send it with the event info.
      event.venue = { connect: { id: newVenueId }}
    }

    try {
      await updateEvent({
        variables: {
          event
        }
      })
    } catch (e) {
      console.log(e)
      return toast.error("This event couldn't save...")
    }
  }

  const onCompleted = () => toast.success("Event saved successfully. 👍", {
    autoClose: 3000
  })

  return (
    <Mutation
      mutation={UPDATE_EVENT_MUTATION}
      variables={{
        eventId
      }}
      onCompleted={onCompleted}
      refetchQueries={[{ query: EVENT_QUERY, variables: { id: eventId } },]}
    >
      {( updateEvent, { loading } ) => (
        <SaveButton
          isActive={!loading}
          isLoading={loading}
          onClick={async () => await saveAction(updateEvent)}
          floating
        >
          Save changes
        </SaveButton>
      )}
    </Mutation>
  )
}

UpdateEventButton.propTypes = {
  eventId: PropTypes.string.isRequired,
  newVenueId: PropTypes.string,
  client: PropTypes.object.isRequired
}

export default withApollo(UpdateEventButton)
export { UPDATE_EVENT_MUTATION }