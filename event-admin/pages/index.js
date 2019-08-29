import React, { useState} from "react"
import PropTypes from "prop-types"
import { Mutation } from "react-apollo"
import gql from "graphql-tag"
import { toast } from "react-toastify"
import { withRouter } from "next/router"

import { Section, Columns, Column, Field, Label, Control, Input } from "bloomer"

import SaveButton from "../components/styles/SaveButton"

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      id
    }
  }
`

// This component has been done really quickly. Feel free to redo it better. Cheers
const IndexPage = ({ router }) => {
  const [email, setEmail,] = useState("")
  const [password, setPassword,] = useState("")

  const doSignIn = async (signIn) => {
    try {
      await signIn()
    } catch(e) {
      return console.log(e)
    }
    toast.success("Signed in successfully! 🚀")
    router.push({ pathname: "/events" })
  }

  return (
    <Section>
      <Columns>
        <Column isSize={{ mobile: 12, tablet: 8, desktop: 6 }}>
          <Field>
            <Label>Email</Label>
            <Control>
              <Input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Control>
          </Field>
          <Field>
            <Label>Password</Label>
            <Control>
              <Input name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Control>
          </Field>
          <Mutation
            mutation={SIGNIN_MUTATION}
            variables={{
              email,
              password
            }}
          >
            {( signIn, {loading, error}) => (
              <>
                <SaveButton
                  isActive={!loading}
                  isLoading={loading}
                  onClick={async () => await doSignIn(signIn)}
                >
                  Sign In
                </SaveButton>
                {error && <p>There&#39;s been an error...</p>}
              </>
            )}
          </Mutation>
        </Column>
      </Columns>
    </Section>
  )
}

IndexPage.propTypes = {
  router: PropTypes.object.isRequired
}

export default withRouter(IndexPage)