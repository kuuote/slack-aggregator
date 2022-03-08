import { slackRequest } from "./request.ts";
import { withRetry } from "./retry.ts";
import { isUser, User } from "./types.ts";
import { stringifyReplacer } from "./util.js";

// deno-lint-ignore no-explicit-any
function getUsers(result: any): User[] {
  if (!result.ok) {
    throw Error("何か失敗してそう");
  }
  if (!Array.isArray(result.members)) {
    throw Error("お前それ本当にusers.listのレスポンスか？");
  }
  return result.members.filter(isUser);
}

console.log("receive users");
const result = await withRetry(() => slackRequest("users.list"));

await Deno.mkdir("./log", { recursive: true });
await Deno.writeTextFile(
  "./log/users.json",
  JSON.stringify(getUsers(result), stringifyReplacer, "\t"),
);
console.log("write users");
