import { defineConfig } from "orval";

export default defineConfig({
  catalog: {
    input: {
      target: "./openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/api/generated/endpoints",
      schemas: "./src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/api-client.ts",
          name: "customFetch",
        },
      },
    },
  },
});
