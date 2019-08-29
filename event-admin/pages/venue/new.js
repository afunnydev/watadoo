import React, { useState } from "react"
import PropTypes from "prop-types"
import { withRouter } from "next/router"
import { Mutation } from "react-apollo"
import gql from "graphql-tag"
import { toast } from "react-toastify"

import { Section, Field, Label, Control, Input } from "bloomer"

import SaveButton from "../../components/styles/SaveButton"

const CREATE_VENUE_MUTATION = gql`
  mutation CREATE_VENUE_MUTATION($name: String!) {
    createVenue(name: $name) {
      id
    }
  }
`

const NewVenue = ({ router }) => {
  const [name, setName,] = useState("")
  const onCompleted = (data) => {
    toast.success(`${name} created successfully`)
    router.push({
      pathname: "/venue",
      query: { id: data.createVenue.id }
    })
    setName("")
  }
  const onError = () => toast.error("An error occured when creating this venue")
  return (
    <Section>
      <Mutation
        mutation={CREATE_VENUE_MUTATION}
        onCompleted={onCompleted}
        onError={onError}
      >
        {(createVenue, { loading }) => (
          <div>
            <form
              onSubmit={async e => {
                e.preventDefault()
                if (name === "") return toast.error("Please give the new venue a name.")
                try {
                  await createVenue({ variables: { name } })
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              <Field>
                <Label>Venue name</Label>
                <Control>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Control>
              </Field>
              <SaveButton
                type="submit"
                isActive={!loading}
                isLoading={loading}
              >
                Add new venue
              </SaveButton>
            </form>
          </div>
        )}
      </Mutation>
    </Section>
  )
}

NewVenue.propTypes = {
  router: PropTypes.object.isRequired
}

export default withRouter(NewVenue)