// deno-lint-ignore-file camelcase
import { slackRequest } from "./request.ts";
import { delay } from "./retry.ts";
import { withRetry } from "./retry.ts";
import { isChannel, isSlackMessage, SlackMessage } from "./types.ts";
import { stringifyReplacer } from "./util.js";
import { isArray } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

function asArray<T extends unknown>(
  // deno-lint-ignore no-explicit-any
  x: any,
  // deno-lint-ignore no-explicit-any
  pred?: (x: any) => x is T,
): Array<T> {
  return Array.isArray(x) ? (pred ? x.filter(pred) : x) : [];
}

type HistoryResponseBase = {
  ok: true;
  messages: SlackMessage[];
};

type HasNoMore = {
  has_more: false;
};

type HasMore = {
  has_more: true;
  response_metadata: {
    next_cursor: string;
  };
};

type Cursor = HasNoMore | HasMore;

type HistoryResponse = HistoryResponseBase & Cursor;

// deno-lint-ignore no-explicit-any
function isValid(x: any): x is HistoryResponse {
  return x?.ok === true &&
    isArray(x?.messages, isSlackMessage) &&
    typeof x?.has_more === "boolean";
}

async function saveMessage(channel: string, msg: unknown) {
  if (!isSlackMessage(msg)) {
    return;
  }
  // deno-lint-ignore no-explicit-any
  delete (msg as any).team;
  // deno-lint-ignore no-explicit-any
  delete (msg as any).client_msg_id;
  // deno-lint-ignore no-explicit-any
  delete (msg as any).type;
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
  if (isValid(result)) {
    return result;
  } else {
    throw Error("Illegal response: " + result);
  }
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
  if (isValid(result)) {
    return result;
  } else {
    throw Error("Illegal response: " + result);
  }
}

async function fetchReplies(channel: string, timestamp: string) {
  console.log("fetch replies start");
  let cursor: string | undefined;
  while (true) {
    const result = await withRetry(() =>
      fetchReply(channel, timestamp, cursor)
    );
    console.log(result.messages);
    await delay(60000 / 50);
    for (const message of result.messages) {
      await saveMessage(channel, message);
    }
    if (result.has_more) {
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
    if (result.has_more) {
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

const channels = asArray(
  JSON.parse(await Deno.readTextFile("./log/channels.json")),
  isChannel,
);

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
