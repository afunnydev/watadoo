import React from "react"
import PropTypes from "prop-types"

import {
  Columns,
  Column,
  Field,
  Control,
  Checkbox,
  Select,
  Label
} from "bloomer"

const ListVenuesFilters = ({ toggleDuplicates, setCity }) => {
  const changeCity = (e) => setCity(e.target.value)
  return (
    <Columns style={{ borderBottom: "1px solid grey"}}>
      <Column isSize={{ mobile: 6, tablet: 3 }}>
        <Field>
          <Control>
            <Checkbox onClick={toggleDuplicates}> Show possible duplicates</Checkbox>
          </Control>
        </Field>
      </Column>
      <Column isSize={{ mobile: 6, tablet: 3 }}>
        <Field isGrouped>
          <Label>City:</Label>
          <Control>
            <Select
              style={{ marginLeft: "20px" }}
              onChange={changeCity}>
              <option value="">All</option>
              <option value="GATINEAU">Gatineau</option>
              <option value="OTTAWA">Ottawa</option>
            </Select>
          </Control>
        </Field>
      </Column>
    </Columns >
  )
}

ListVenuesFilters.propTypes = {
  toggleDuplicates: PropTypes.func.isRequired,
  setCity: PropTypes.func.isRequired
}

export default ListVenuesFilters
