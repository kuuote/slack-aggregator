import { is, u } from "./deps/unknownutil.ts";
import { slackRequest } from "./request.ts";
import { delay } from "./retry.ts";
import { withRetry } from "./retry.ts";
import { Channel, isChannel } from "./types.ts";
import { stringifyReplacer } from "./util.js";
import { channelsType } from "./var.ts";

const isChannelsResponse = is.ObjectOf({
  ok: is.LiteralOf(true),
  channels: is.ArrayOf(isChannel),
  response_metadata: is.ObjectOf({
    next_cursor: is.String,
  }),
});

type ChannelsResponse = u.PredicateType<typeof isChannelsResponse>;

async function fetchChannels(cursor?: string): Promise<ChannelsResponse> {
  const fd = new FormData();
  if (cursor) {
    fd.append("cursor", cursor);
    fd.append("types", channelsType);
  }
  const result = await slackRequest("conversations.list", fd);
  return u.ensure(result, isChannelsResponse);
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
