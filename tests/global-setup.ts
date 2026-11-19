import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    tmpRoot: string;
  }
}

// libSQL keeps database files open until the worker process exits (Windows refuses to delete
// them before that), so test databases live under one root that is removed after all workers finish.
export default function setup(project: TestProject) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coy-test-"));
  project.provide("tmpRoot", root);
  return () => fs.rmSync(root, { recursive: true, force: true });
}
