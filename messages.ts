import { is, u } from "./deps/unknownutil.ts";
import { slackRequest } from "./request.ts";
import { delay } from "./retry.ts";
import { withRetry } from "./retry.ts";
import { isChannel, isSlackMessage as isSlackMessageO } from "./types.ts";
import { stringifyReplacer } from "./util.js";

const isSlackMessage = is.IntersectionOf([
  isSlackMessageO,
  is.ObjectOf({
    team: is.Unknown,
    client_msg_id: is.Unknown,
    type: is.Unknown,
  }),
]);

const isHistoryResponse = is.ObjectOf({
  ok: is.LiteralOf(true),
  messages: is.ArrayOf(isSlackMessage),
});

type HistoryResponse = u.PredicateType<typeof isHistoryResponse>;

const hasMore = is.ObjectOf({
  has_more: is.LiteralOf(true),
  response_metadata: is.ObjectOf({
    next_cursor: is.String,
  }),
});

async function saveMessage(channel: string, msg: unknown) {
  if (!isSlackMessage(msg)) {
    return;
  }

  delete msg.team;
  delete msg.client_msg_id;
  delete msg.type;

  const baseDir = "./log/messages/" + channel;
  await Deno.mkdir(baseDir, { recursive: true });
  const msgPath = baseDir + "/" + msg.ts.replace(".", "");
  await Deno.writeTextFile(
    msgPath,
    JSON.stringify(msg, stringifyReplacer, "\t"),
  );
}

async function fetchHistory(
  channel: string,
  oldest: string,
  cursor?: string,
): Promise<HistoryResponse> {
  const fd = new FormData();
  fd.append("channel", channel);
  fd.append("oldest", oldest);
  if (cursor) {
    fd.append("cursor", cursor);
  }
  const result = await slackRequest("conversations.history", fd);
  return u.ensure(
    result,
    isHistoryResponse,
  );
}

async function fetchReply(
  channel: string,
  timestamp: string,
  cursor?: string,
): Promise<HistoryResponse> {
  const fd = new FormData();
  fd.append("channel", channel);
  fd.append("ts", timestamp);
  if (cursor) {
    fd.append("cursor", cursor);
  }
  const result = await slackRequest("conversations.replies", fd);
  return u.ensure(
    result,
    isHistoryResponse,
  );
}

async function fetchReplies(channel: string, timestamp: string) {
  console.log("fetch replies start");
  let cursor: string | undefined;
  while (true) {
    const result = await withRetry(() =>
      fetchReply(channel, timestamp, cursor)
    );
    console.log(result.messages);
    for (const message of result.messages) {
      await saveMessage(channel, message);
    }
    if (hasMore(result)) {
      cursor = result.response_metadata.next_cursor;
    } else {
      return;
    }
  }
}

async function fetchAll(channel: string, oldest: string) {
  let cursor: string | undefined;
  while (true) {
    const result = await withRetry(() => fetchHistory(channel, oldest, cursor));
    console.log(result.messages);
    await delay(60000 / 50);
    for (const message of result.messages) {
      // is root of thread
      if (message.ts === message.thread_ts) {
        await fetchReplies(channel, message.ts);
      }
      await saveMessage(channel, message);
    }
    if (hasMore(result)) {
      cursor = result.response_metadata.next_cursor;
    } else {
      return;
    }
  }
}

const range = Deno.args[0] ?? String(
  prompt("aggregate range?(if 'oldest' was given, aggregate all messages):"),
);
let boundary = NaN;

if (range === "oldest") {
  boundary = 0;
} else {
  const parsed = parseFloat(range);
  if (isNaN(parsed)) {
    throw Error("Please input a number");
  }
  boundary = Math.floor(Date.now() / 1000 - parsed);
}

const fails: string[] = [];

const channels = u.maybe(
  JSON.parse(await Deno.readTextFile("./log/channels.json")),
  is.ArrayOf(isChannel),
) ?? [];

for (const channel of channels) {
  try {
    await fetchAll(channel.id, boundary.toString());
  } catch {
    console.warn("fetch failed " + channel.name);
    fails.push(channel.name);
  }
}

if (fails.length !== 0) {
  console.log("fails: " + fails.join());
}
