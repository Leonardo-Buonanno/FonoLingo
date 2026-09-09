import { z } from "zod";

// Gemini accepts a JSON Schema subset. Keep the full Zod constraints for
// server-side validation while sending a simpler structural schema to the model.
export function toProviderSchema(schema) {
  const localOnly = new Set([
    "$schema",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
  ]);
  return JSON.parse(
    JSON.stringify(z.toJSONSchema(schema), (key, value) =>
      localOnly.has(key) ? undefined : value,
    ),
  );
}
