# Avanza API

## Install

```
npm install --save avanza-api
```

## Usage

```js
import Avanza from "avanza-api";
const avanza = new Avanza();

await avanza.authenticate({
  username: "",
  password: "",
  totpSecret: ""
});

if (avanza.isAuthenticated) {
  const accounts = await avanza.getAccounts();
  console.log(accounts);
}
```
