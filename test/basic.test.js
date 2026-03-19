import test from "node:test";
import assert from "node:assert/strict";

import { COMMON_INDICATORS, resolveIndicator } from "../src/worldbank.js";

test("resolveIndicator maps friendly aliases to World Bank indicator ids", () => {
  assert.equal(resolveIndicator("gdp"), COMMON_INDICATORS.GDP);
  assert.equal(resolveIndicator("gdp growth"), COMMON_INDICATORS.GDP_GROWTH);
  assert.equal(resolveIndicator("population"), COMMON_INDICATORS.POPULATION);
});

test("resolveIndicator returns raw indicator ids unchanged", () => {
  assert.equal(resolveIndicator("SP.POP.TOTL"), "SP.POP.TOTL");
});
