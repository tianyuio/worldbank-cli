const API_BASE_URL = "https://api.worldbank.org/v2";
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_COUNT = 3;
const INDICATOR_SEARCH_PAGES = 8;
const INDICATOR_PAGE_SIZE = 250;

function scoreIndicatorMatch(indicator, keyword) {
  const id = String(indicator.id ?? "").toLowerCase();
  const name = String(indicator.name ?? "").toLowerCase();
  const sourceNote = String(indicator.sourceNote ?? "").toLowerCase();
  const compactKeyword = keyword.replace(/\s+/g, "");

  let score = 0;

  if (id === keyword || name === keyword) {
    score += 100;
  }
  if (id.startsWith(keyword) || id.startsWith(compactKeyword)) {
    score += 50;
  }
  if (name.startsWith(keyword)) {
    score += 40;
  }
  if (name.includes(keyword)) {
    score += 20;
  }
  if (id.includes(keyword) || id.includes(compactKeyword)) {
    score += 25;
  }
  if (sourceNote.includes(keyword)) {
    score += 5;
  }

  return score;
}

export const COMMON_INDICATORS = {
  GDP: "NY.GDP.MKTP.CD",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",
  GNI: "NY.GNP.MKTP.CD",
  GNI_PER_CAPITA: "NY.GNP.PCAP.CD",
  EXPORTS_GDP: "NE.EXP.GNFS.ZS",
  FDI_NET: "BN.KLT.DINV.CD",
  INFLATION: "FP.CPI.TOTL.ZG",
  UNEMPLOYMENT: "SL.UEM.TOTL.ZS",
  POPULATION: "SP.POP.TOTL",
  LIFE_EXPECTANCY: "SP.DYN.LE00.IN",
  BIRTH_RATE: "SP.DYN.CBRT.IN",
  DEATH_RATE: "SP.DYN.CDRT.IN",
  INTERNET_USERS: "IT.NET.USER.ZS",
  LITERACY_RATE: "SE.ADT.LITR.ZS",
  SCHOOL_ENROLLMENT: "SE.PRM.ENRR",
  SCHOOL_COMPLETION: "SE.PRM.CMPT.ZS",
  TEACHERS_PRIMARY: "SE.PRM.TCHR",
  EDUCATION_EXPENDITURE: "SE.XPD.TOTL.GD.ZS",
  HEALTH_EXPENDITURE: "SH.XPD.CHEX.GD.ZS",
  PHYSICIANS: "SH.MED.PHYS.ZS",
  HOSPITAL_BEDS: "SH.MED.BEDS.ZS",
  IMMUNIZATION: "SH.IMM.MEAS",
  HIV_PREVALENCE: "SH.DYN.AIDS.ZS",
  MALNUTRITION: "SH.STA.MALN.ZS",
  TUBERCULOSIS: "SH.TBS.INCD"
};

export function resolveIndicator(input) {
  const normalized = input.trim().toUpperCase().replace(/[-\s]/g, "_");
  return COMMON_INDICATORS[normalized] ?? input;
}

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE_URL}/${path}`);
  url.searchParams.set("format", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export async function requestWorldBank(path, params = {}) {
  const url = buildUrl(path, params);
  let lastError;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(`World Bank API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format from the World Bank API.");
      }

      if (data[0]?.message) {
        const message = Array.isArray(data[0].message)
          ? data[0].message.map((item) => item.value).join("; ")
          : "The World Bank API returned an error.";
        throw new Error(message);
      }

      return data;
    } catch (error) {
      lastError = error;

      if (attempt < DEFAULT_RETRY_COUNT) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  const causeMessage = lastError?.cause?.code ?? lastError?.message ?? "Unknown error";
  throw new Error(`Unable to reach the World Bank API after ${DEFAULT_RETRY_COUNT} attempts: ${causeMessage}`);
}

export async function getCountries({ region, incomeLevel, limit = 50 } = {}) {
  const [meta, countries] = await requestWorldBank("country", {
    per_page: limit,
    region,
    incomeLevel
  });

  return {
    meta,
    items: countries.filter(
      (country) => country.region?.value !== "Aggregates" && country.id?.length === 3
    )
  };
}

export async function getCountry(code) {
  const [, countries] = await requestWorldBank(`country/${code}`);
  const country = countries[0];

  if (!country) {
    throw new Error(`Country not found for code "${code}".`);
  }

  return country;
}

export async function searchIndicators(keyword, { limit = 25 } = {}) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const matches = [];
  let meta = null;

  for (let page = 1; page <= INDICATOR_SEARCH_PAGES; page += 1) {
    const [pageMeta, indicators] = await requestWorldBank("indicator", {
      source: 2,
      per_page: INDICATOR_PAGE_SIZE,
      page
    });

    meta = pageMeta;

    for (const indicator of indicators) {
      const haystack = [
        indicator.id,
        indicator.name,
        indicator.sourceNote,
        indicator.sourceOrganization
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (haystack.includes(normalizedKeyword)) {
        matches.push({
          indicator,
          score: scoreIndicatorMatch(indicator, normalizedKeyword)
        });
      }
    }

    if (page >= Number(pageMeta.pages || 0)) {
      break;
    }
  }

  matches.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return String(left.indicator.name).localeCompare(String(right.indicator.name));
  });

  return {
    meta,
    items: matches.slice(0, limit).map((entry) => entry.indicator)
  };
}

export async function getIndicatorData(countryCode, indicator, { years = 10 } = {}) {
  const resolvedIndicator = resolveIndicator(indicator);
  const [, series] = await requestWorldBank(
    `country/${countryCode}/indicator/${resolvedIndicator}`,
    { per_page: years }
  );

  return series.filter((entry) => entry.value !== null);
}
