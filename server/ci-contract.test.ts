import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the two defects that made default-branch CI fail before any
 * project command ran: setup-node was caching npm in a pnpm repo, and
 * pnpm-lock.yaml contained duplicated mapping keys from a bad merge.
 */
describe("CI contract", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const lockfile = readFileSync("pnpm-lock.yaml", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    packageManager?: string;
  };

  it("installs with the pnpm version declared in package.json", () => {
    const pinned = pkg.packageManager?.split("+")[0];
    expect(pinned).toBe("pnpm@10.33.0");
    expect(pkg.packageManager).toMatch(/^pnpm@10\.33\.0\+sha512\.[0-9a-f]{128}$/);
    expect(workflow).toMatch(
      /^[ \t]*uses:[ \t]*pnpm\/action-setup@[0-9a-f]{40}[ \t]+# v4\.\d+\.\d+[ \t]*$/m,
    );
    expect(workflow).not.toMatch(/^\s*version:/m);
    expect(workflow).toContain("cache: pnpm");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).not.toMatch(/cache:\s*"?npm"?/);
    expect(workflow).not.toMatch(/(^|\s)npm install\b/);
  });

  it("runs typecheck, tests, and build as failing steps", () => {
    expect(workflow).toContain("pnpm run check");
    expect(workflow).toContain("pnpm test");
    expect(workflow).toContain("pnpm run build");
    expect(workflow).not.toContain("|| echo");
    expect(workflow).not.toContain("continue-on-error");
  });

  it("keeps a lockfile pnpm can parse", () => {
    expect(lockfile.startsWith("lockfileVersion: '9.0'")).toBe(true);
    expect(duplicateBlockKeys(lockfile)).toEqual([]);
    const duplicated = [
      "packages:",
      "  left@1.0.0:",
      "    resolution: {integrity: abc}",
      "  left@1.0.0:",
      "    resolution: {integrity: abc}",
    ].join("\n");
    expect(duplicateBlockKeys(duplicated)).toContain("left@1.0.0");
  });
});

function duplicateBlockKeys(yaml: string): string[] {
  const duplicates: string[] = [];
  const stack: Array<Map<string, true>> = [new Map()];

  for (const rawLine of yaml.split("\n")) {
    const line = rawLine.replace(/\t/g, "  ");
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    if (indent % 2 !== 0) continue;
    const depth = indent / 2;
    while (stack.length > depth + 1) stack.pop();
    while (stack.length < depth + 1) stack.push(new Map());

    const trimmed = line.trim();
    const keyMatch = /^([^:\[\{][^:]*):(?:\s|$)/.exec(trimmed);
    if (!keyMatch) continue;
    const key = keyMatch[1].trim();
    const level = stack[depth];
    if (level.has(key)) duplicates.push(key);
    level.set(key, true);
    if (!trimmed.endsWith(":") || /:\s+\S/.test(trimmed)) {
      // scalar or flow value; no nested block map follows
    } else {
      stack[depth + 1] = new Map();
    }
  }

  return duplicates;
}
