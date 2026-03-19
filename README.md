# World Bank CLI 🌐

[![npm version](https://img.shields.io/npm/v/@tianyuio/worldbank-cli)](https://www.npmjs.com/package/@tianyuio/worldbank-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

World Bank CLI based on World Bank Open Data API, which provides query capabilities for global economic and social development data.

## Features

- List countries with optional region and income-level filters
- Look up detailed metadata for a specific country
- Search indicators by keyword
- Query time-series data for a country and indicator
- Use friendly indicator aliases such as `GDP`, `POPULATION`, and `LIFE_EXPECTANCY`
- Show the latest available observation with `--latest`
- List supported World Bank income-level codes directly in the terminal
- List supported World Bank region codes directly in the terminal
- Output either readable tables or raw JSON
- Export list and time-series output as CSV

## Installation

### Install globally with npm

```bash
npm install -g @tianyuio/worldbank-cli
wb help
```

### Run instantly with npx

```bash
npx @tianyuio/worldbank-cli help
```

## Usage

```bash
wb countries [--region REGION] [--income-level LEVEL] [--limit N] [--json] [--format table|csv|json]
wb country <country-code> [--json]
wb indicators <keyword> [--limit N] [--json] [--format table|csv|json]
wb data <country-code> <indicator> [--years N] [--latest] [--json] [--format table|csv|json]
wb income-levels [--json] [--format table|csv|json]
wb regions [--json] [--format table|csv|json]
wb aliases
```

## Examples

```bash
wb countries --limit 10
wb countries --region EAS --limit 20
wb country CN
wb indicators literacy
wb data US GDP --latest
wb data US GDP --years 5 --format csv
wb income-levels
wb regions
wb data IN SP.POP.TOTL --json
wb aliases
```

## Commands

### `wb countries`

List countries from the World Bank API.

Options:

- `--region <code>`: Filter by region code
- `--income-level <code>`: Filter by income level code
- `--limit <n>`: Limit the number of returned rows
- `--json`: Print raw JSON instead of a table
- `--format <type>`: Print as `table`, `csv`, or `json`

### `wb country <country-code>`

Show country metadata such as region, income level, capital city, and coordinates.

Examples:

```bash
wb country US
wb country BR --json
```

### `wb indicators <keyword>`

Search for matching indicators.

Examples:

```bash
wb indicators gdp
wb indicators "life expectancy"
wb indicators gdp --format csv
```

### `wb data <country-code> <indicator>`

Query time-series indicator data for a country.

The `<indicator>` argument accepts either:

- A friendly alias like `GDP`, `GDP_GROWTH`, `POPULATION`, or `LIFE_EXPECTANCY`
- A raw World Bank indicator id like `SP.POP.TOTL`

Options:

- `--years <n>`: Number of years to fetch, default `10`
- `--latest`: Return only the latest available observation
- `--json`: Print raw JSON instead of a table
- `--format <type>`: Print as `table`, `csv`, or `json`

Examples:

```bash
wb data CN GDP --years 10
wb data US GDP --latest
wb data US GDP --years 5 --format csv
wb data KE LIFE_EXPECTANCY
wb data DE NY.GDP.PCAP.CD
```

### `wb income-levels`

List the common World Bank income-level codes used by the `wb countries --income-level ...` filter.

Examples:

```bash
wb income-levels
wb income-levels --format csv
```

### `wb regions`

List the common World Bank region codes used by the `wb countries --region ...` filter.

Examples:

```bash
wb regions
wb regions --format csv
```

### `wb aliases`

Print the built-in alias table for common indicators.

## Supported Indicators

### Economic Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| GDP | Gross Domestic Product | Current US$ |
| GDP_GROWTH | GDP growth rate | Annual % |
| GDP_PER_CAPITA | GDP per capita | Current US$ |
| GNI | Gross National Income | Current US$ |
| GNI_PER_CAPITA | GNI per capita | Current US$ |
| EXPORTS_GDP | Exports of goods and services | % of GDP |
| FDI_NET | Foreign direct investment, net inflows | Current US$ |
| INFLATION | Inflation rate | Annual % |
| UNEMPLOYMENT | Unemployment rate | % of total labor force |

### Social Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| POPULATION | Population, total | People |
| LIFE_EXPECTANCY | Life expectancy at birth | Years |
| BIRTH_RATE | Birth rate | per 1,000 people |
| DEATH_RATE | Death rate | per 1,000 people |
| INTERNET_USERS | Internet users | % of population |

### Education Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| LITERACY_RATE | Literacy rate | % of people ages 15 and above |
| SCHOOL_ENROLLMENT | School enrollment, primary | % gross |
| SCHOOL_COMPLETION | Primary completion rate | % of relevant age group |
| TEACHERS_PRIMARY | Teachers in primary education | Count |
| EDUCATION_EXPENDITURE | Government expenditure on education | % of GDP |

### Health and Nutrition Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| HEALTH_EXPENDITURE | Current health expenditure | % of GDP |
| PHYSICIANS | Physicians | per 1,000 people |
| HOSPITAL_BEDS | Hospital beds | per 1,000 people |
| IMMUNIZATION | Immunization, measles | % of children ages 12-23 months |
| HIV_PREVALENCE | Prevalence of HIV | % of population ages 15-49 |
| MALNUTRITION | Prevalence of undernourishment | % of population |
| TUBERCULOSIS | Incidence of tuberculosis | per 100,000 people |

### Common Country Codes

| Country | Code | Country | Code |
|------|------|------|------|
| China | CN | United States | US |
| Japan | JP | Germany | DE |
| United Kingdom | GB | France | FR |
| India | IN | Brazil | BR |
| Russia | RU | Australia | AU |

## Project Structure

```text
worldbank-cli/
├── src/
│   ├── cli.js         # CLI entry point
│   ├── format.js      # Table and JSON output helpers
│   └── worldbank.js   # World Bank API client and indicator aliases
├── test/
│   └── basic.test.js  # Basic tests
├── package.json       # Package configuration
├── README.md          # Documentation
└── LICENSE            # MIT license
```

## Technology Stack

- **Node.js** - Runtime environment
- **Native Fetch API** - HTTP requests to the World Bank API
- **Node Test Runner** - Built-in test framework
- **Plain JavaScript (ES Modules)** - Lightweight CLI implementation without external runtime dependencies

## API Endpoints

This project uses the World Bank Open Data API:

- Base URL: `https://api.worldbank.org/v2`
- Country data: `/country`
- Country details: `/country/{code}`
- Indicator catalog: `/indicator`
- Country indicator data: `/country/{code}/indicator/{id}`

## Development

### Run locally

```bash
node ./src/cli.js help
```

### Install globally from a local checkout

```bash
npm install -g .
wb help
```

Run tests:

```bash
npm test
```

Run the CLI directly:

```bash
node ./src/cli.js help
```

## Notes

- The CLI uses the public World Bank Open Data API at `https://api.worldbank.org/v2`
- API availability and response completeness depend on the World Bank service
- Some indicators have missing values for recent years, so the CLI filters out `null` observations

## License

MIT
