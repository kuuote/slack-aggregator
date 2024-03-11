import { cookie, token } from "./var.ts";
import { baseURL } from "./var.ts";

export async function slackRequest(
  method: string,
  data = new FormData(),
): Promise<unknown> {
  data.set("token", String(token));
  const result = await fetch(baseURL + method, {
    headers: cookie == null ? {} : {
      cookie,
    },
    body: data,
    method: "POST",
  });
  return await result.json();
}
