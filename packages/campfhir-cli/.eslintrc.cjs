/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  extends: "@bonfhir/eslint-config",
  overrides: [
    {
      files: ["**/{.*,*.config}.{cjs,js,mjs,ts}"],
      env: {
        browser: true,
        node: true,
        es2020: true,
      },
    },
  ],
};
