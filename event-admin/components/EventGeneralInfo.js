import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"
import { Container, Columns, Column, Field, Label, Control, Input, TextArea, Help, Checkbox } from "bloomer"
import { withApollo, Query } from "react-apollo"
import gql from "graphql-tag"
import { Widget } from "@uploadcare/react-widget"

import { eventInfoFragment } from "../lib/fragments"

import MessengerCard from "./MessengerCard"
import VenueAutocompleteSelect from "./VenueAutocompleteSelect"
import CategorySelect from "./CategorySelect"
import OverrideTabStyleA from "./styles/OverrideTabStyleA"

const EVENT_GENERAL_INFO_QUERY = gql`
  query EVENT_GENERAL_INFO_QUERY($id: ID!) {
    event(id: $id) @client {
      ...EventInfo
    }
  }
  ${eventInfoFragment}
`

const EventGeneralInfo = ({ eventId, newVenueId, setNewVenueId, client }) => {
  const updateStore = (e) => client.writeData(
    { id: `Event:${eventId}`, data: { [e.target.name]: e.target.value } }
  )
  const updateImageUrl = (imageUrl) => client.writeData(
    { id: `Event:${eventId}`, data: { imageUrl } }
  )
  const changeCheckedValue = (e) => client.writeData(
    { id: `Event:${eventId}`, data: { [e.target.name]: e.target.checked } }
  )

  return (
    <Query
      query={EVENT_GENERAL_INFO_QUERY}
      variables={{ id: eventId }}
    >
      {({ data, loading, error }) => {
        if (error) return <p>Error</p>
        if (loading) return <p>Loading...</p>
        if (!data || !data.event) return <p>Error</p>
        const {
          name,
          shortDescription,
          description,
          venue,
          ticketUrl,
          imageUrl,
          source,
          wpFrId,
          wpEnId,
          link,
          importNotes,
          possibleDuplicate,
          category
        } = data.event
        return (
          <Container>
            <Columns isCentered>
              <Column isSize={{ mobile: 12, tablet: 6 }}>
                <Field>
                  <Label>Name*</Label>
                  <Control>
                    <Input name="name" type="text" defaultValue={name} onBlur={updateStore} />
                  </Control>
                </Field>
                <Field>
                  <Label>Venue*</Label>
                  <VenueAutocompleteSelect defaultValue={venue && venue.nameFr} onChange={setNewVenueId} />
                  <Help isColor="black">More info on this venue <Link href={{ pathname: "/venue", query: { id: newVenueId || venue && venue.id || "" } }}><OverrideTabStyleA target="_blank">here</OverrideTabStyleA></Link>.</Help>
                </Field>
                <Field>
                  <Label>Category*</Label>
                  <CategorySelect value={category} onChange={updateStore} />
                </Field>
                <Field>
                  <Label>Short Description</Label>
                  <Control>
                    <TextArea rows="2" name="shortDescription" defaultValue={shortDescription} onBlur={updateStore} />
                    {shortDescription
                      ? <Help isColor={shortDescription.length > 70 ? "danger" : "info"}>{shortDescription.length > 70 ? `You can only have 70 characters. You currently have ${shortDescription.length}.` : "This will be used for the description in the Messenger Card. If empty, we use a part of the full description."}</Help>
                      : <Help isColor="info">This will be used for the description in the Messenger Card. If empty, we use a part of the full description.</Help>
                    }
                  </Control>
                </Field>
                <Field>
                  <Label>Description*</Label>
                  <Control>
                    <TextArea rows="10" name="description" defaultValue={description} onBlur={updateStore} />
                    <Help isColor="info">This will be used for the description on the landing page. Please add as much information as possible.</Help>
                  </Control>
                </Field>
                <Field>
                  <Label>Image*</Label>
                  <Control>
                    <Widget
                      publicKey="461e0a2215fc1f23ad92"
                      id="imageUrl"
                      previewStep="true"
                      imagesOnly="true"
                      crop="1.91:1"
                      imageShrink="600x314"
                      onChange={info => updateImageUrl(info.cdnUrl)}
                    />
                    <Help isColor="info">Don&#39;t forget to save after changing the image.</Help>
                  </Control>
                </Field>
                <Field>
                  <Label>Import Notes</Label>
                  <Control>
                    <Input name="importNotes" type="text" defaultValue={importNotes} onBlur={updateStore} />
                    <Checkbox name="possibleDuplicate" checked={possibleDuplicate} onChange={changeCheckedValue}> This is event is a possible duplicate.</Checkbox>
                  </Control>
                </Field>
                <Field>
                  <Label>Ticket URL</Label>
                  <Control>
                    <Input name="ticketUrl" type="text" defaultValue={ticketUrl} onBlur={updateStore} />
                  </Control>
                </Field>
                <Field>
                  <Label>Wordpress</Label>
                  <p>
                    {wpFrId !== 0 && wpEnId !== 0
                      ? "This event has been imported in the Wordpress Site."
                      : "This event is not in the Wordpress Site."}
                  </p>
                  {wpFrId !== 0
                    ? <p>You can find the french version <OverrideTabStyleA href={`https://watadoo.ca/wp-admin/post.php?post=${wpFrId}&action=edit`} target="_blank" rel="noopener noreferrer">here</OverrideTabStyleA>.</p>
                    : null}
                  {wpEnId !== 0
                    ? <p>You can find the french version <OverrideTabStyleA href={`https://watadoo.ca/wp-admin/post.php?post=${wpEnId}&action=edit`} target="_blank" rel="noopener noreferrer">here</OverrideTabStyleA>.</p>
                    : null}
                </Field>
                <Field>
                  <Label>External Link Source</Label>
                  <Control>
                    <Input disabled name="link" type="text" defaultValue={link} />
                  </Control>
                </Field>
                <Field>
                  <Label>Source</Label>
                  <Control>
                    <Input disabled name="link" type="text" defaultValue={source} />
                  </Control>
                </Field>
              </Column>
              <Column isSize={{ mobile: 12, tablet: 6 }}>
                <MessengerCard
                  id={eventId}
                  title={name}
                  image={imageUrl}
                  description={description}
                  shortDescription={shortDescription}
                />
              </Column>
            </Columns>
          </Container>
        )
      }}
    </Query>
  )
}

EventGeneralInfo.propTypes = {
  eventId: PropTypes.string.isRequired,
  newVenueId: PropTypes.string,
  setNewVenueId: PropTypes.func.isRequired,
  client: PropTypes.object.isRequired
}

export default withApollo(EventGeneralInfo)
