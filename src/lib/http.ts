import { NextResponse } from "next/server";
import { DiscoverError } from "./discover";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function handleError(err: unknown) {
  if (err instanceof DiscoverError) {
    return json({ error: { code: err.code, message: err.message } }, err.status);
  }
  console.error(err);
  return json({ error: { code: "internal", message: "Something went wrong" } }, 500);
}
