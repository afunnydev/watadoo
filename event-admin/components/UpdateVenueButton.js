import React from "react"
import PropTypes from "prop-types"
import { Mutation } from "react-apollo"
import gql from "graphql-tag"
import { toast } from "react-toastify"

import SaveButton from "./styles/SaveButton"
import { VENUE_QUERY } from "../pages/venue.js"

const UPDATE_VENUE_MUTATION = gql`
  mutation UPDATE_VENUE_MUTATION($venueId: ID!, $venue: VenueUpdateInput!) {
    updateVenue(venueId: $venueId, venue: $venue) {
      id
      nameFr
    }
  }
`

const UpdateVenueButton = ({ venueId, client }) => {
  const saveAction = async (updateVenue) => {
    let query
    try {
      query = await client.readQuery({
        query: VENUE_QUERY,
        variables: {
          id: venueId
        }
      })
    } catch(e) {
      console.log(e)
      return toast.error("This event couldn't save...")
    }
    const venue = Object.assign({}, query.venue)
    delete venue.id
    delete venue.events
    delete venue.__typename

    try {
      await updateVenue({
        variables: {
          venue
        }
      })
    } catch (e) {
      console.log(e)
      return toast.error("This event couldn't save...")
    }
  }

  const onCompleted = () => toast.success("Venue saved successfully. 👍", {
    autoClose: 3000
  })

  return (
    <Mutation
      mutation={UPDATE_VENUE_MUTATION}
      variables={{
        venueId
      }}
      onCompleted={onCompleted}
    >
      {( updateVenue, { loading, error } ) => (
        <>
          <SaveButton
            isActive={!loading}
            isLoading={loading}
            onClick={async () => await saveAction(updateVenue)}
            floating
          >
            Save changes
          </SaveButton>
          { error && <p>Une erreur s&#39;est produite.</p>}
        </>
      )}
    </Mutation>
  )
}

UpdateVenueButton.propTypes = {
  venueId: PropTypes.string.isRequired,
  client: PropTypes.object.isRequired
}

export default UpdateVenueButton