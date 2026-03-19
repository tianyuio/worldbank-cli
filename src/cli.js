#!/usr/bin/env node

import {
  getCountries,
  getCountry,
  getIncomeLevels,
  getIndicatorData,
  getRegions,
  resolveIndicator,
  searchIndicators
} from "./worldbank.js";
import {
  printCsv,
  printIndicatorAliases,
  printJson,
  printKeyValue,
  printTable
} from "./format.js";

const HELP_TEXT = `
wb - Query World Bank Open Data from your terminal

Usage:
  wb countries [--region REGION] [--income-level LEVEL] [--limit N] [--json] [--format table|csv|json]
  wb country <country-code> [--json]
  wb indicators <keyword> [--limit N] [--json] [--format table|csv|json]
  wb data <country-code> <indicator> [--years N] [--latest] [--json] [--format table|csv|json]
  wb income-levels [--json] [--format table|csv|json]
  wb regions [--json] [--format table|csv|json]
  wb aliases
  wb help

Examples:
  wb countries --limit 10
  wb country CN
  wb indicators gdp
  wb data US GDP --latest
  wb data US GDP --years 5 --format csv
  wb income-levels
  wb regions
  wb data IN SP.POP.TOTL --json
`;

function parseArgs(argv) {
  const positionals = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const key = arg.slice(2);

    if (key === "json" || key === "latest") {
      options[key] = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (nextValue === undefined || nextValue.startsWith("--")) {
      throw new Error(`Missing value for option --${key}`);
    }

    options[key] = nextValue;
    index += 1;
  }

  return { positionals, options };
}

function toPositiveInteger(value, fallback, label) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function normalizeCountryCode(code) {
  return code.trim().toUpperCase();
}

function getOutputFormat(options) {
  if (options.json) {
    return "json";
  }

  const format = options.format ?? "table";
  if (!["table", "csv", "json"].includes(format)) {
    throw new Error('--format must be one of "table", "csv", or "json".');
  }

  return format;
}

function outputRows(rows, columns, format) {
  if (format === "json") {
    printJson(rows);
    return;
  }

  if (format === "csv") {
    printCsv(rows, columns);
    return;
  }

  printTable(rows, columns);
}

async function handleCountries(options) {
  const limit = toPositiveInteger(options.limit, 50, "--limit");
  const result = await getCountries({
    region: options.region,
    incomeLevel: options["income-level"],
    limit
  });
  const format = getOutputFormat(options);
  const columns = [
    { header: "Code", getValue: (row) => row.id, maxWidth: 6 },
    { header: "Name", getValue: (row) => row.name, maxWidth: 36 },
    { header: "Region", getValue: (row) => row.region?.value ?? "", maxWidth: 22 },
    { header: "Income Level", getValue: (row) => row.incomeLevel?.value ?? "", maxWidth: 22 }
  ];

  outputRows(result.items, columns, format);
}

async function handleCountry(positionals, options) {
  const countryCode = positionals[1];
  if (!countryCode) {
    throw new Error("Usage: wb country <country-code>");
  }

  const country = await getCountry(normalizeCountryCode(countryCode));

  if (options.json) {
    printJson(country);
    return;
  }

  printKeyValue({
    Code: country.id,
    ISO2: country.iso2Code,
    Name: country.name,
    Region: country.region?.value,
    "Income Level": country.incomeLevel?.value,
    "Lending Type": country.lendingType?.value,
    Capital: country.capitalCity,
    Longitude: country.longitude,
    Latitude: country.latitude
  });
}

async function handleIndicators(positionals, options) {
  const keyword = positionals.slice(1).join(" ").trim();
  if (!keyword) {
    throw new Error("Usage: wb indicators <keyword>");
  }

  const limit = toPositiveInteger(options.limit, 25, "--limit");
  const result = await searchIndicators(keyword, { limit });
  const format = getOutputFormat(options);
  const columns = [
    { header: "ID", getValue: (row) => row.id, maxWidth: 24 },
    { header: "Name", getValue: (row) => row.name, maxWidth: 54 },
    { header: "Source", getValue: (row) => row.source?.value ?? "", maxWidth: 26 }
  ];

  outputRows(result.items, columns, format);
}

async function handleIncomeLevels(options) {
  const incomeLevels = getIncomeLevels();
  const format = getOutputFormat(options);
  const columns = [
    { header: "Code", getValue: (row) => row.code, maxWidth: 6 },
    { header: "Name", getValue: (row) => row.name, maxWidth: 24 }
  ];

  outputRows(incomeLevels, columns, format);
}

async function handleRegions(options) {
  const regions = getRegions();
  const format = getOutputFormat(options);
  const columns = [
    { header: "Code", getValue: (row) => row.code, maxWidth: 6 },
    { header: "Name", getValue: (row) => row.name, maxWidth: 32 }
  ];

  outputRows(regions, columns, format);
}

async function handleData(positionals, options) {
  const countryCode = positionals[1];
  const indicator = positionals[2];

  if (!countryCode || !indicator) {
    throw new Error("Usage: wb data <country-code> <indicator>");
  }

  const years = toPositiveInteger(options.years, 10, "--years");
  const format = getOutputFormat(options);
  const series = await getIndicatorData(normalizeCountryCode(countryCode), indicator, { years });
  const data = options.latest ? series.slice(0, 1) : series;

  if (format === "json") {
    printJson(data);
    return;
  }

  const columns = [
    { header: "Year", getValue: (row) => row.date, maxWidth: 8 },
    {
      header: "Value",
      getValue: (row) =>
        typeof row.value === "number" ? row.value.toLocaleString("en-US") : ""
    },
    { header: "Unit", getValue: (row) => row.unit || "", maxWidth: 24 },
    { header: "Status", getValue: (row) => row.obs_status || "", maxWidth: 12 }
  ];

  if (format === "csv") {
    printCsv(data, columns);
    return;
  }

  const indicatorLabel = data[0]?.indicator?.value ?? resolveIndicator(indicator);
  console.log(`Indicator: ${indicatorLabel}`);
  console.log(`Country: ${data[0]?.country?.value ?? normalizeCountryCode(countryCode)}`);
  console.log("");

  printTable(data, columns);
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2));
  const command = positionals[0] ?? "help";

  switch (command) {
    case "countries":
      await handleCountries(options);
      break;
    case "country":
      await handleCountry(positionals, options);
      break;
    case "indicators":
      await handleIndicators(positionals, options);
      break;
    case "data":
      await handleData(positionals, options);
      break;
    case "income-levels":
      await handleIncomeLevels(options);
      break;
    case "regions":
      await handleRegions(options);
      break;
    case "aliases":
      printIndicatorAliases();
      break;
    case "help":
    case "--help":
    case "-h":
      console.log(HELP_TEXT.trim());
      break;
    default:
      throw new Error(`Unknown command "${command}". Run "wb help" to see usage.`);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
