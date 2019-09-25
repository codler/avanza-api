import "fetch-register";
import authenticate, { Credentials } from "./authenticate";

class Avanza {
  session;

  async authenticate(options: Credentials): Promise<void> {
    this.session = await authenticate(options);
  }
}

export default Avanza;
