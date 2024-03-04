import { is, u } from "./deps/unknownutil.ts";

/* channel */

export const isChannel = is.ObjectOf({
  id: is.String,
  name: is.String,
});

export type Channel = u.PredicateType<typeof isChannel>;

/* user */

export const isUser = is.ObjectOf({
  id: is.String,
  name: is.String,
  real_name: is.String,
});

export type User = u.PredicateType<typeof isUser>;

/* message */

export const isSlackMessage = is.ObjectOf({
  ts: is.String,
  thread_ts: is.OptionalOf(is.String),
});

export type SlackMessage = u.PredicateType<typeof isSlackMessage>;
