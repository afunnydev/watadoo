import React from "react"
import PropTypes from "prop-types"
import styled from "styled-components"

import { Card, CardContent, Title, Content} from "bloomer"

const MessengerCardImage = styled.div`
  width: 100%;
  padding-top: 52%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  background-image: url('${props => props.image}');
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
`
const FacebookLink = styled.a`
  color: #0084ff;
`

const MessengerCard = ({ id, title, image, shortDescription, description }) => (
  <Card>
    <MessengerCardImage image={image} />
    <CardContent>
      <Title isSize={3}>{title}</Title>
      <Content>
        { shortDescription ? shortDescription : description ? description.replace(/(\r\n|\n|\r)/gm, "").replace(/<\/?[^>]+(>|$)/g, "").substr(0, 70) : "Cliquez sur l'événement pour en savoir plus" }
        <br/>
        <small><a href={`https://evenements.watadoo.ca/?id=${id}`} target="_blank" rel="noopener noreferrer">evenements.watadoo.ca</a></small>
      </Content>
    </CardContent>
    <CardContent hasTextAlign="centered">
      <FacebookLink href={`https://evenements.watadoo.ca/?id=${id}`} target="_blank" rel="noopener noreferrer">En savoir plus</FacebookLink>
    </CardContent>
    <CardContent hasTextAlign="centered">
      <FacebookLink href="#">Partager</FacebookLink>
    </CardContent>
  </Card>
)

MessengerCard.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  description: PropTypes.string,
  shortDescription: PropTypes.string
}

export default MessengerCard