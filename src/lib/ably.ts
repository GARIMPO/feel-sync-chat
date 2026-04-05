import Ably from "ably";

const ABLY_API_KEY = "Pkp64g.O_USqg:CKXBGeEsJEMo5f484PclkQyUa88Gwiu7ltFT1C5nLeQ";

let client: Ably.Realtime | null = null;

export function getAblyClient(clientId: string): Ably.Realtime {
  if (!client) {
    client = new Ably.Realtime({
      key: ABLY_API_KEY,
      clientId,
    });
  }
  return client;
}
