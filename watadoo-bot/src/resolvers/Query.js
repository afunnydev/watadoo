const Query = {
  async event(parent, args, context) {
    const fragment = `
      fragment EventWithVenue on Event {
        id
        name
        description
        shortDescription
        link
        imageUrl
        price
        venue {
          id
          nameFr
        }
        type
        tags
        ticketUrl
        source
      }
    `;
    return await context.prisma.event({ id: args.id}).$fragment(fragment);
  }
};

module.exports = Query;