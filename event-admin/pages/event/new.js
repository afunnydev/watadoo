import React, { useState } from "react"
import PropTypes from "prop-types"
import { withRouter } from "next/router"
import { Mutation } from "react-apollo"
import gql from "graphql-tag"
import { toast } from "react-toastify"

import { Section, Field, Label, Control, Input } from "bloomer"

import SaveButton from "../../components/styles/SaveButton"

const CREATE_EVENT_MUTATION = gql`
  mutation CREATE_EVENT_MUTATION($name: String!) {
    createEvent(name: $name) {
      id
    }
  }
`

const NewEvent = ({ router }) => {
  const [name, setName,] = useState("")
  const onCompleted = (data) => {
    toast.success(`${name} created successfully`)
    router.push({
      pathname: "/event",
      query: { id: data.createEvent.id }
    })
    setName("")
  }
  const onError = () => toast.error("An error occured when creating this event")
  return (
    <Section>
      <Mutation
        mutation={CREATE_EVENT_MUTATION}
        onCompleted={onCompleted}
        onError={onError}
      >
        {(createEvent, { loading }) => (
          <div>
            <form
              onSubmit={async e => {
                e.preventDefault()
                if (name === "") return toast.error("Please give the new event a name.")
                try {
                  await createEvent({ variables: { name } })
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              <Field>
                <Label>Event name</Label>
                <Control>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Control>
              </Field>
              <SaveButton
                type="submit"
                isActive={!loading}
                isLoading={loading}
              >
                Add new event
              </SaveButton>
            </form>
          </div>
        )}
      </Mutation>
    </Section>
  )
}

NewEvent.propTypes = {
  router: PropTypes.object.isRequired
}

export default withRouter(NewEvent)