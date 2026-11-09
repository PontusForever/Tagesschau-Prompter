import { rm } from "node:fs/promises";

const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}

await Promise.all(
  ["package-lock.json", "yarn.lock"].map((file) =>
    rm(new URL(`../${file}`, import.meta.url), { force: true }),
  ),
);
