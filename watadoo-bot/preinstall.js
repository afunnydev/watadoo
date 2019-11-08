// Solution found here: https://medium.com/@nwkeeley/a-better-solution-would-be-to-4fde38db8401
const fs = require("fs");
fs.writeFile("./google-credentials-heroku.json", process.env.GOOGLE_CONFIG, () => {});