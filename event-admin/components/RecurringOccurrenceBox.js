import React from "react"
import styled from "styled-components"
import PropTypes from "prop-types"
import { Box, Columns, Column, Field, Label, Control, Select } from "bloomer"
import DatePicker from "react-datepicker"

// import addMinutes from "../lib/addMinutes"

const DaySpan = styled.span`
  font-weight: 700;
  text-transform: capitalize;
  text-decoration: underline;
`

const RecurringOccurrenceBox = ({ day, pattern, updateFn }) => (
  <Box>
    <Columns isMultiline>
      <Column isSize={{ mobile: 12, tablet: 2 }}>
        <DaySpan>{day}</DaySpan>
      </Column>
      <Column isSize={{ mobile: 12, tablet: 2 }}>
        <Field>
          <Label>Frequency</Label>
          <Control>
            <Select value={pattern.frequency} onChange={(e) => updateFn(day, "frequency", e.target.value)} name="frequency">
              <option value="never">Never</option>
              <option value="week">Every week</option>
              <option value="bimonthly">Every 2 weeks</option>
            </Select>
          </Control>
        </Field>
      </Column>
      <Column isSize={{ mobile: 12, tablet: 4 }}>
        <Field>
          <Label>Next Start Time</Label>
          <Control>
            <DatePicker
              selected={pattern.nextStartDate ? new Date(pattern.nextStartDate) : null}
              onChange={date => {
                // if (date) {
                //   // The timezone in QC and ONT is GMT-4, representing a offset of 240. Let's say I'm managing this events hour from Japan. I will be in GMT+9 (represented by a offset of -540). When I select a time, this time is the time in QC/ONT, so I need to adjust the selected time by -780. Work In Progress, this doesn't work because the react-datepicker still shows the time in the timezone.
                //   const minutesToAdd = -240 + date.getTimezoneOffset()
                //   date = addMinutes(date, minutesToAdd)
                // }
                updateFn(day, "nextStartDate", date ? date.toISOString() : null)
              }}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="input"
            />
          </Control>
        </Field>
      </Column>
      <Column isSize={{ mobile: 12, tablet: 4 }}>
        <Field>
          <Label>Next End Time</Label>
          <Control>
            <DatePicker
              selected={pattern.nextEndDate ? new Date(pattern.nextEndDate) : null}
              onChange={date => {
                // if (date) {
                //   // The timezone in QC and ONT is GMT-4, representing a offset of 240. Let's say I'm managing this events hour from Japan. I will be in GMT+9 (represented by a offset of -540). When I select a time, this time is the time in QC/ONT, so I need to adjust the selected time by -780. Work In Progress, this doesn't work because the react-datepicker still shows the time in the timezone.
                //   const minutesToAdd = -240 + date.getTimezoneOffset()
                //   date = addMinutes(date, minutesToAdd)
                // }
                updateFn(day, "nextEndDate", date ? date.toISOString() : null)
              }}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="input"
            />
          </Control>
        </Field>
      </Column>
    </Columns>
  </Box>
)

RecurringOccurrenceBox.propTypes = {
  day: PropTypes.string.isRequired,
  pattern: PropTypes.object.isRequired,
  updateFn: PropTypes.func.isRequired
}

export default RecurringOccurrenceBox
