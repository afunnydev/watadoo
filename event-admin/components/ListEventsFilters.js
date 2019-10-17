import React from "react"
import PropTypes from "prop-types"

import {
  Columns,
  Column,
  Field,
  Control,
  Select,
  Label
} from "bloomer"

const ListEventsFilters = ({ setCategory }) => {
  const changeCategory = (e) => setCategory(e.target.value)
  const categories = ["ACTIVITES", "COMEDY", "FAMILY", "FESTIVALS", "FOOD", "MUSEUMS", "MUSIC", "SPORTS", "THEATER", "VARIETY", "OTHER",]
  return (
    <Columns style={{ borderBottom: "1px solid grey" }}>
      <Column isSize={{ mobile: 6, tablet: 3 }}>
        <Field isGrouped>
          <Label>Category:</Label>
          <Control>
            <Select
              style={{ marginLeft: "20px" }}
              onChange={changeCategory}>
              <option value="">All</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </Control>
        </Field>
      </Column>
    </Columns >
  )
}

ListEventsFilters.propTypes = {
  setCategory: PropTypes.func.isRequired
}

export default ListEventsFilters
