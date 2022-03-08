import { cookie, token } from "./var.ts";
import { baseURL } from "./var.ts";

export async function slackRequest(
  method: string,
  data = new FormData(),
): Promise<unknown> {
  data.set("token", token);
  const result = await fetch(baseURL + method, {
    headers: {
      cookie,
    },
    body: data,
    method: "POST",
  });
  return await result.json();
}
