const { prisma } = require("../generated/prisma-client");

exports.uptime = async () => {
  try {
    let date = new Date();
    const events = await prisma.events({
      first: 5
    });
    if (!events || !events.length) return false;
  } catch(e) {
    return false;
  }

  try {
    const users = await prisma.users({
      first: 5
    });
    if (!users || !users.length) return false;
  } catch (e) {
    return false;
  }

  return true;
};