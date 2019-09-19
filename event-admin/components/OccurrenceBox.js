import React, { useState } from "react"
import PropTypes from "prop-types"
import { Query, withApollo } from "react-apollo"
import gql from "graphql-tag"
import { Box, Columns, Column, Field, Control, Label, Input, TextArea, Button } from "bloomer"
import DatePicker from "react-datepicker"
import { Widget } from "@uploadcare/react-widget"

import addMinutes from "../lib/addMinutes"
import { occurrenceFragment } from "../lib/fragments"
import RemoveOccurrenceButton from "./RemoveOccurrenceButton"

const OCCURRENCE_QUERY = gql`
  query OCCURRENCE_QUERY($id: ID!) {
    occurrence(id: $id) @client {
      ...OccurrenceInfo
    }
  }
  ${occurrenceFragment}
`

const OccurrenceBox = ({ id, full, client }) => {
  const [minimized, setMinimized,] = useState(false)
  const updateStore = (e) => client.writeData(
    { id: `EventOccurrence:${id}`, data: { [e.target.name]: e.target.value } }
  )
  const updateDate = (name, date) => {
    // The timezone in QC and ONT is GMT-4, representing a offset of 240. Let's say I'm managing this events hour from Japan. I will be in GMT+9 (represented by a offset of -540). When I select a time, this time is the time in QC/ONT, so I need to adjust the selected time by -780. Work In Progress, this doesn't work because the react-datepicker still shows the time in the timezone.
    // const minutesToAdd = -240 + date.getTimezoneOffset()
    const timezoneAdjustedDate = addMinutes(date, 0)
    client.writeData({ id: `EventOccurrence:${id}`, data: { [name]: timezoneAdjustedDate.toISOString() } })
  }
  const updateImageUrl = (imageUrl) => client.writeData(
    { id: `EventOccurrence:${id}`, data: { imageUrl } }
  )

  return (
    <Query
      query={OCCURRENCE_QUERY}
      variables={{ id }}
    >
      {({ data, loading, error }) => {
        if (error) return <Box>Error</Box>
        if (loading) return <Box>Loading</Box>
        if (!data || !data.occurrence) return <Box>Error</Box>
        const {
          name,
          description,
          imageUrl,
          startDate,
          endDate
        } = data.occurrence
        const startDateObject = new Date(startDate)
        const endDateObject = new Date(endDate)
        return <Box>
          <Columns isMultiline>
            {full && !minimized && <Column isSize={{ mobile: 12, tablet: 12 }}>
              <Columns isMultiline>
                <Column isSize={{ mobile: 12, tablet: 8 }}>
                  <Field>
                    <Label>Name*</Label>
                    <Control>
                      <Input name="name" type="text" defaultValue={name} onBlur={updateStore} style={{ marginBottom: 15 }} />
                      <Widget
                        publicKey="461e0a2215fc1f23ad92"
                        id="imageUrl"
                        previewStep="true"
                        imagesOnly="true"
                        crop="1.91:1"
                        imageShrink="600x314"
                        onChange={info => updateImageUrl(info.cdnUrl)}
                      />
                    </Control>
                  </Field>
                  <Field>
                    <Label>Description*</Label>
                    <Control>
                      <TextArea rows="2" name="description" defaultValue={description} onBlur={updateStore} />
                    </Control>
                  </Field>
                </Column>
                <Column
                  isSize={{ mobile: 12, tablet: 4 }}
                  style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover"}}
                />
              </Columns>
            </Column>}
            <Column isSize={{ mobile: 12, tablet: 6 }}>
              <Field>
                <Label>Start Date*</Label>
                <Control>
                  <DatePicker
                    selected={startDateObject}
                    onChange={date => updateDate("startDate", date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="input"
                  />
                </Control>
              </Field>
            </Column>
            <Column isSize={{ mobile: 12, tablet: 6 }}>
              <Field>
                <Label>End Date</Label>
                <Control>
                  <DatePicker
                    selected={endDate ? endDateObject : null}
                    onChange={date => updateDate("endDate", date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="input"
                  />
                </Control>
              </Field>
            </Column>
            <Column isSize={{ mobile: 12 }}>
              <RemoveOccurrenceButton occurrenceId={id} />
              <Button
                isColor="light"
                onClick={() => setMinimized(!minimized)}
                style={{ marginLeft: 10 }}
              >
                {minimized ? "Expand" : "Minimize"}
              </Button>
            </Column>
          </Columns>
        </Box>
      }}
    </Query>
  )
}
OccurrenceBox.defaultProps = {
  full: false
}

OccurrenceBox.propTypes = {
  id: PropTypes.string.isRequired,
  full: PropTypes.bool,
  client: PropTypes.object.isRequired
}

export default withApollo(OccurrenceBox)
