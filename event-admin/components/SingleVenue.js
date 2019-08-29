import React from "react"
import PropTypes from "prop-types"

import { Section, Columns, Column, Field, Label, Control, Input } from "bloomer"

import UpdateVenueButton from "./UpdateVenueButton"
import VenueEvents from "./VenueEvents"
import CitySelect from "./CitySelect"

const SingleVenue = ({ venue, client }) => {
  const updateStore = (e) => client.writeData(
    { id: `Venue:${venue.id}`, data: { [e.target.name]: e.target.value } }
  )
  const updateFloatInStore = (e) => client.writeData(
    { id: `Venue:${venue.id}`, data: { [e.target.name]: parseFloat(e.target.value) } }
  )
  const {
    id,
    nameFr,
    address,
    events,
    city,
    lat,
    long
  } = venue
  return (
    <Section>
      <h1>{nameFr} ({id})</h1>
      <Columns isCentered>
        <Column isSize={{mobile: 12, tablet: 6}}>
          <Field>
            <Label>Name FR</Label>
            <Control>
              <Input name="nameFr" type="text" defaultValue={nameFr} onBlur={updateStore} />
            </Control>
          </Field>
          <Field>
            <Label>Address</Label>
            <Control>
              <Input name="address" type="text" defaultValue={address} onBlur={updateStore} />
            </Control>
          </Field>
          <Field>
            <Label>City</Label>
            <Control>
              <CitySelect value={city} onChange={updateStore} />
            </Control>
          </Field>
          <Field>
            <Label>Latitude</Label>
            <Control>
              <Input name="lat" type="number" defaultValue={lat} step="any" onBlur={updateFloatInStore} />
            </Control>
          </Field>
          <Field>
            <Label>Longitude</Label>
            <Control>
              <Input name="long" type="number" defaultValue={long} step="any" onBlur={updateFloatInStore} />
            </Control>
          </Field>
          <UpdateVenueButton venueId={id} client={client} />
        </Column>
        <Column isSize={{mobile: 12, tablet: 6}}>
          <h2>Events scheduled at {nameFr}</h2>
          {events && events.length && <VenueEvents events={events} />}
        </Column>
      </Columns>
    </Section>
  )
}

SingleVenue.propTypes = {
  venue: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired
}

export default SingleVenue