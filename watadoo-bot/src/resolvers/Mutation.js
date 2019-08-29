const Mutation = {
  async saveSeenEvent(parent, args, context) {
    return context.prisma.updateUser({
      data: {
        interestedEvents: {
          connect: {
            id: args.eventId
          }
        }
      },
      where: {
        id: args.userId
      }
    });
  }
};

module.exports = Mutation;