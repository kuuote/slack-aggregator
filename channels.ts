// deno-lint-ignore-file camelcase
import { slackRequest } from "./request.ts";
import { delay } from "./retry.ts";
import { withRetry } from "./retry.ts";
import { Channel, isChannel } from "./types.ts";
import { stringifyReplacer } from "./util.js";
import { isArray } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { channelsType } from "./var.ts";

type ChannelsResponse = {
  ok: true;
  channels: Channel[];
  response_metadata: {
    next_cursor: string;
  };
};

// deno-lint-ignore no-explicit-any
function isValid(x: any): x is ChannelsResponse {
  return x?.ok === true &&
    isArray(x?.channels, isChannel) &&
    typeof x?.response_metadata?.next_cursor === "string";
}

async function fetchChannels(cursor?: string): Promise<ChannelsResponse> {
  const fd = new FormData();
  if (cursor) {
    fd.append("cursor", cursor);
    fd.append("types", channelsType);
  }
  const result = await slackRequest("conversations.list", fd);
  if (isValid(result)) {
    return result;
  } else {
    throw Error("Illegal response: " + result);
  }
}

async function fetchAll(): Promise<Channel[]> {
  let cursor: string | undefined;
  const channels: Channel[] = [];
  while (true) {
    const response = await withRetry(() => fetchChannels(cursor));
    console.log("received channel");
    channels.push(...response.channels);
    if (response.response_metadata.next_cursor) {
      cursor = response.response_metadata.next_cursor;
    } else {
      return channels;
    }
    await delay(3000);
  }
}

try {
  const channels = await fetchAll();
  await Deno.mkdir("./log", { recursive: true });
  await Deno.writeTextFile(
    "./log/channels.json",
    JSON.stringify(channels, stringifyReplacer, "\t"),
  );
  console.log("write channels");
} catch (e) {
  console.warn("fetch failed");
  console.warn(e);
}
