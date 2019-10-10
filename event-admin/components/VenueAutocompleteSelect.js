import React, { useState } from "react"
import PropTypes from "prop-types"
import styled from "styled-components"
import { withApollo } from "react-apollo"
import gql from "graphql-tag"
import debounce from "lodash.debounce"
import Downshift, { resetIdCounter } from "downshift"

import { Control, Input } from "bloomer"

const SEARCH_VENUES_QUERY = gql`
  query SEARCH_VENUES_QUERY($searchTerm: String!) {
    venues(where: { OR: [{ nameFr_contains: $searchTerm }, { address_contains: $searchTerm }] }) {
      id
      nameFr
    }
  }
`

const SearchContainer = styled.div`
  border: 1px solid rgba(0,0,0,0.3);
  cursor: pointer;
  > div {
    border: 1px solid rgba(0,0,0,0.3);
    &.selected {
      background-color: rgba(0,0,0,0.2);
    }
  }
`

const VenueAutocompleteSelect = ({ defaultValue, onChange, client }) => {
  const [venues, setVenues,] = useState([])
  const [loading, setLoading,] = useState(false)
  const [searched, setSearched,] = useState(false)
  resetIdCounter()
  const onQuery = debounce(async (e, closeMenuFn) => {
    if (e.target.value.length < 2) {
      setVenues([])
      return closeMenuFn()
    }
    setLoading(true)
    // Manually query apollo client
    const res = await client.query({
      query: SEARCH_VENUES_QUERY,
      variables: { searchTerm: e.target.value }
    })
    setVenues(res.data.venues || [])
    setLoading(false)
    setSearched(true)
  }, 600)
  return (
    <Downshift
      onChange={(venue) => onChange(venue.id)}
      itemToString={item => (item === null ? "" : item.nameFr)}
      initialSelectedItem={defaultValue ? { nameFr: defaultValue } : null}
    >
      {({ getInputProps, getItemProps, isOpen, inputValue, highlightedIndex, closeMenu }) => (
        <div>
          <Control isLoading={loading}>
            <Input
              {...getInputProps({
                type: "text",
                placeholder: "Cherchez le lieu par son nom.",
                name: "search",
                onChange: e => {
                  // The searched state makes sure that we don't show a "not found" message when we haven't done the search for the term yet.
                  setSearched(false)
                  e.persist()
                  onQuery(e, closeMenu)
                }
              })}
            />
          </Control>
          {isOpen && (
            <SearchContainer>
              {venues.map((venue, index) => (
                <div key={venue.id} {...getItemProps({ item: venue })} className={index === highlightedIndex ? "selected" : ""}>
                  {venue.nameFr}
                </div>
              ))}
              {!venues.length && !loading && searched && <div>
                Nous n&#39;avons pas trouvé de lieu pour {inputValue}. {inputValue[0] !== inputValue[0].toUpperCase() && `Essayez avec '${inputValue.charAt(0).toUpperCase() + inputValue.substring(1)}'.`}
              </div>}
            </SearchContainer>
          )}
        </div>
      )}
    </Downshift>
  )
}

VenueAutocompleteSelect.propTypes = {
  defaultValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  client: PropTypes.object.isRequired
}

export default withApollo(VenueAutocompleteSelect)