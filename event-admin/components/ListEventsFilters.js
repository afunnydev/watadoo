import React from "react"
import PropTypes from "prop-types"

import {
  Columns,
  Column,
  Field,
  Label
} from "bloomer"
import CategorySelect from "./CategorySelect"

const ListEventsFilters = ({ value, setCategory }) => {
  const changeCategory = (e) => setCategory(e.target.value)
  return (
    <Columns style={{ borderBottom: "1px solid grey" }}>
      <Column isSize={{ mobile: 6, tablet: 3 }}>
        <Field isGrouped>
          <Label style={{ marginRight: "20px" }}>Category:</Label>
          <CategorySelect all value={value} onChange={changeCategory} />
        </Field>
      </Column>
    </Columns >
  )
}

ListEventsFilters.propTypes = {
  value: PropTypes.string.isRequired,
  setCategory: PropTypes.func.isRequired
}

export default ListEventsFilters
