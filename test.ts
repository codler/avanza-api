import Avanza from "./index";
const avanza = new Avanza();

init();
async function init() {
  try {
    avanza.session = require("./session.json");
  } catch {}
  if (!avanza.isAuthenticated) {
    await avanza.authenticate(require("./credential.json"));
  }

  if (avanza.isAuthenticated) {
    console.log("Session", avanza.session);
    const accounts = await avanza.getAccounts();
    console.log(accounts);
  } else {
    console.log("Failed to authenticate");
  }
}
