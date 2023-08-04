// deno-lint-ignore-file no-explicit-any

/* channel */

export type Channel = {
  id: string;
  name?: string;
};

export function isChannel(x: any): x is Channel {
  return typeof x?.id === "string" &&
    (typeof x?.name === "string" ||
      x?.name == null);
}

/* user */

export type User = {
  id: string;
  name: string;
  real_name: string;
};

export function isUser(x: any): x is User {
  return typeof x?.id === "string" &&
    typeof x?.name === "string" &&
    typeof x?.real_name === "string";
}

/* message */

export type SlackMessage = {
  ts: string;
  thread_ts?: string;
};

export function isSlackMessage(x: any): x is SlackMessage {
  return typeof x?.ts === "string";
}
