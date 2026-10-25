import { describe, expect, test } from "bun:test";
import { apiFile, artifactNames, hooksFile, keysFile, validateManifest } from "../scripts/scaffold-customer-api.mjs";

const feature = {
  domain: "sample",
  featureDir: "src/features/customer/sample",
  keyName: "sampleKeys",
  operations: [
    { name: "listItems", hook: "useItemsQuery", kind: "query", method: "GET", path: "/items/:itemId", queryType: "ListParams", responseType: "Item", paginated: true },
    { name: "uploadItem", hook: "useUploadItemMutation", kind: "mutation", method: "POST", path: "/items/:itemId/files", bodyType: "FormData", responseType: "Item", invalidate: true },
  ],
};

describe("customer API scaffold", () => {
  test("is deterministic and emits safe paths, query cancellation, pagination and multipart bodies", () => {
    expect(apiFile(feature)).toBe(apiFile(structuredClone(feature)));
    expect(apiFile(feature)).toContain("encodeURIComponent(itemId)");
    expect(apiFile(feature)).toContain("params, signal");
    expect(apiFile(feature)).toContain("unwrapPage");
    expect(apiFile(feature)).toContain("data: input");
  });

  test("creates hierarchical keys and narrow feature invalidation", () => {
    expect(artifactNames(feature)).toEqual({ api: "sample-api.ts", hooks: "use-sample.ts", keys: "query-keys.ts" });
    expect(keysFile(feature)).toContain('["customer", "sample"]');
    expect(hooksFile(feature)).toContain("placeholderData: keepPreviousData");
    expect(hooksFile(feature)).toContain("invalidateQueries({ queryKey: sampleKeys.root() })");
  });

  test("rejects duplicate operations, invalid methods and unsafe output paths", () => {
    expect(() => validateManifest([{ ...feature, featureDir: "../outside" }])).toThrow("Unsafe feature directory");
    expect(() => validateManifest([{ ...feature, operations: [feature.operations[0], feature.operations[0]] }])).toThrow("Duplicate operation");
    expect(() => validateManifest([{ ...feature, operations: [{ ...feature.operations[0], method: "TRACE" }] }])).toThrow("Invalid method");
  });
});
