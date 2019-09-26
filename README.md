# Avanza API

## Install

```
npm i avanza-api
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

### Login with BankId

```js
avanza.authenticate({
  personnummer: "123456789012"
});
```

If multiple username are connected to your BankId, you will need to choose which to login by adding username key.

```js
avanza.authenticate({
  username: "",
  personnummer: "123456789012"
});
```
