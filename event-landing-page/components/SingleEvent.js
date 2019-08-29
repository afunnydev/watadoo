import React from "react"
import PropTypes from "prop-types"
import { Query } from "react-apollo"
import gql from "graphql-tag"
import styled from "styled-components"

import { Container, Section } from "bloomer"

const EVENT_QUERY = gql`
  query EVENT_QUERY($id: ID!){
    event(id: $id) {
      id
      name
      description
      imageUrl
      ticketUrl
      venue {
        nameFr
      }
    }
  }
`

const ImgDiv = styled.div`
  text-align: center;
  margin-top: 30px;
  img {
    max-width: 100%;
    width: 400px;
  }
`

class SingleEvent extends React.Component {
  constructor(props) {
    super(props)
  }

  async componentDidMount() {
    if (this.props.userId) {
      await this.props.saveSeenEvent({
        variables: {
          userId: this.props.userId,
          eventId: this.props.eventId
        }
      })
    }
  }

  render() {
    return(
      <div>
        {this.props.eventId
          && <Query
            query={EVENT_QUERY}
            variables={{
              id: this.props.eventId
            }}
          >
            {({data, loading, error}) => {
              console.log(data)
              if (error) return <Container><Section><p>Une erreur s'est produite. Veuillez recharger la page SVP.</p></Section></Container>
              if (loading) return <p>Loading...</p>
              if (!data || !data.event) return <Container><Section><p>Il n'y a pas d'événement avec cet identifiant.</p></Section></Container>
              return (
                <Container>
                  <Section>
                    <h1>{data.event.name} - {data.event.venue.nameFr}</h1>
                    <p>{data.event.description}</p>
                    {data.event.ticketUrl && <a href={data.event.ticketUrl} target="_blank" rel="noopener noreferrer" className="button">Acheter des billets</a>}
                    <ImgDiv>
                      <img src={data.event.imageUrl} />
                    </ImgDiv>
                  </Section>
                </Container>
              )
            }}
          </Query>}
      </div>
    )
  }
}

SingleEvent.propTypes = {
  eventId: PropTypes.string.isRequired,
  userId: PropTypes.string,
  saveSeenEvent: PropTypes.func.isRequired
}

export default SingleEvent