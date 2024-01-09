import "https://deno.land/std@0.209.0/dotenv/load.ts"; // auto-load doetnv

export const token = Deno.env.get("SLACK_TOKEN");
export const cookie = Deno.env.get("SLACK_COOKIE");

const workSpace = Deno.env.get("SLACK_WORKSPACE");

export const baseURL = `https://${workSpace}.slack.com/api/`;
