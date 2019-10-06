import Avanza, { InstrumentType } from "./index";
const avanza = new Avanza({
  preFetch: function(...rest) {
    console.log("Request", rest);
    return rest;
  }
});

initPublic();
async function initPublic() {
  const search = await avanza.searchList("abb");
  console.log(search);
}

// init();
async function init() {
  try {
    avanza.session = require("../session.json");
  } catch {}
  if (!avanza.isAuthenticated) {
    try {
      await avanza.authenticate(require("../credential.json"));
    } catch (e) {
      console.log("Test: Catch:", e);
    }
  }

  if (avanza.isAuthenticated) {
    console.log("Session", avanza.session);

    const accounts = await avanza.getAccounts();

    const positions = await avanza.getPositions();

    const orderbookIds = positions
      .filter(position => position.instrumentType !== InstrumentType.UNKNOWN)
      .map(position => position.orderbookId);
    console.log("TCL: orderbookIds", orderbookIds);

    const ava = await avanza.getOrderbooks(orderbookIds);
    console.log(ava);
  } else {
    console.log("Test: Failed to authenticate");
  }
}
