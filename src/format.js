import { COMMON_INDICATORS } from "./worldbank.js";

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function pad(value, width) {
  return value.padEnd(width, " ");
}

export function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function printKeyValue(data) {
  const rows = Object.entries(data).filter(([, value]) => value !== undefined && value !== "");
  const keyWidth = Math.max(...rows.map(([key]) => key.length), 0);

  for (const [key, value] of rows) {
    console.log(`${pad(key, keyWidth)}  ${value}`);
  }
}

export function printCsv(rows, columns) {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  console.log(header);

  for (const row of rows) {
    const line = columns
      .map((column) => escapeCsvValue(column.getValue(row)))
      .join(",");
    console.log(line);
  }
}

export function printTable(rows, columns) {
  if (rows.length === 0) {
    console.log("No results.");
    return;
  }

  const widths = columns.map((column) => {
    const headerWidth = column.header.length;
    const cellWidth = Math.max(
      ...rows.map((row) => String(column.getValue(row) ?? "").length),
      0
    );

    return Math.min(Math.max(headerWidth, cellWidth), column.maxWidth ?? Infinity);
  });

  const header = columns
    .map((column, index) => pad(column.header, widths[index]))
    .join("  ");
  const divider = widths.map((width) => "-".repeat(width)).join("  ");

  console.log(header);
  console.log(divider);

  for (const row of rows) {
    const line = columns
      .map((column, index) => {
        const value = String(column.getValue(row) ?? "");
        return pad(truncate(value, widths[index]), widths[index]);
      })
      .join("  ");
    console.log(line);
  }
}

export function printIndicatorAliases() {
  const rows = Object.entries(COMMON_INDICATORS).map(([alias, id]) => ({ alias, id }));
  printTable(rows, [
    { header: "Alias", getValue: (row) => row.alias, maxWidth: 28 },
    { header: "Indicator ID", getValue: (row) => row.id, maxWidth: 24 }
  ]);
}
