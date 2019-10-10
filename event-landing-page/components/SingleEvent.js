import React from "react"
import PropTypes from "prop-types"
import { Query } from "react-apollo"
import gql from "graphql-tag"
import styled from "styled-components"

import { Container, Section } from "bloomer"
import EventSchedule from "./EventSchedule"

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
        address
      }
      isRecurring
      recurrencePattern
      occurrencesAreUnique
      occurrences {
        id
        name
        description
        startDate
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

const MoreInfo = styled.div`
  margin: 20px 0px;
`

const AdDiv = styled.div`
  p {
    font-style: italic;
  }
  img {
    display: block;
    margin-top: 20px;
    width: 100%;
    max-width: 600px;
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
              if (error) return <Container><Section><p>Une erreur s&apos;est produite. Veuillez recharger la page SVP.</p></Section></Container>
              if (loading) return <p>Loading...</p>
              if (!data || !data.event) return <Container><Section><p>Il n&apos;y a pas d&apos;événement avec cet identifiant.</p></Section></Container>
              return (
                <Container>
                  <Section>
                    <h1>{data.event.name}</h1>
                    <p>{data.event.description}</p>
                    <EventSchedule event={data.event} />
                    <MoreInfo>
                      <p><strong>Lieu:</strong> {data.event.venue.nameFr}</p>
                      <p><strong>Adresse:</strong> {data.event.venue.address}</p>
                    </MoreInfo>
                    {data.event.ticketUrl && <a href={data.event.ticketUrl} target="_blank" rel="noopener noreferrer" className="button">Acheter des billets</a>}
                    {data.event.imageUrl !== "https://watadoo.ca/wp-content/uploads/2019/03/watadoo-icon.jpg" && <ImgDiv>
                      <img src={data.event.imageUrl} />
                    </ImgDiv>}
                    <AdDiv>
                      <p>Cet événement vous est présenté par: <img src="/static/ace-ad.jpg" /></p>
                    </AdDiv>
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