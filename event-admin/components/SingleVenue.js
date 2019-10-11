import React, { useState } from "react"
import PropTypes from "prop-types"
import { toast } from "react-toastify"

import { Section, Columns, Column, Field, Label, Control, Input } from "bloomer"

import UpdateVenueButton from "./UpdateVenueButton"
import VenueEvents from "./VenueEvents"
import CitySelect from "./CitySelect"
import SaveButton from "./styles/SaveButton"

const SingleVenue = ({ venue, client }) => {
  const [fetchLoading, setFetchLoading,] = useState(false)

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
    zip,
    events,
    city,
    lat,
    long
  } = venue
  const fetchGeocodeAPI = () => {
    setFetchLoading(true)
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(nameFr)}&components=country:CA&key=${process.env.REACT_APP_GEOCODE_KEY}`)
      .then((response) => response.json())
      .then((r) => {
        if (r.status !== "OK") {
          setFetchLoading(false)
          return toast.error("Something wrong happened while autocompleting. Please complete manually.")
        }
        if (!r.results || !r.results.length) {
          setFetchLoading(false)
          return toast.error("No match were found 😢. Please complete manually.")
        }
        const result = r.results[0]
        let zip = ""
        const len = result.address_components.length
        for (let i = 1; i < len + 1; i++) {
          // Reverse order because postal_code usually last.
          const el = result.address_components[len - i]
          if (el.types.includes("postal_code")) {
            zip = el.long_name
            break
          }
        }
        client.writeData({
          id: `Venue:${venue.id}`,
          data: {
            address: result.formatted_address,
            lat: result.geometry.location.lat,
            long: result.geometry.location.lng,
            zip
          }
        })
        setFetchLoading(false)
        return toast.success("Autocompleted. Please verify the data.")
      })
  }
  return (
    <Section>
      <h1>{nameFr} ({id})</h1>
      <Columns isCentered>
        <Column isSize={{mobile: 12, tablet: 6}}>
          <Field>
            <Label>Name FR</Label>
            <Control>
              <Input name="nameFr" type="text" value={nameFr} onChange={updateStore} />
              <SaveButton
                style={{ marginTop: 20}}
                isActive={!fetchLoading}
                isLoading={fetchLoading}
                onClick={fetchGeocodeAPI}>Try to autocomplete fields</SaveButton>
            </Control>
          </Field>
          <Field>
            <Label>Address</Label>
            <Control>
              <Input name="address" type="text" value={address} onChange={updateStore} />
            </Control>
          </Field>
          <Field>
            <Label>Zip</Label>
            <Control>
              <Input name="zip" type="text" value={zip} onChange={updateStore} />
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
              <Input name="lat" type="number" value={lat} step="any" onChange={updateFloatInStore} />
            </Control>
          </Field>
          <Field>
            <Label>Longitude</Label>
            <Control>
              <Input name="long" type="number" value={long} step="any" onChange={updateFloatInStore} />
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