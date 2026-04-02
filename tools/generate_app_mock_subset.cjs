const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_PATH = path.resolve("src/app/mockData/generated/customerMasterDerived.generated.ts");
const OUTPUT_PATH = path.resolve("src/app/mockData/generated/customerMasterDerived.app.ts");
const REQUEST_LIMIT = (() => {
  const parsed = Number.parseInt(process.env.APP_MOCK_LIMIT ?? "1200", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1200;
})();

function loadGeneratedMock() {
  let source = fs.readFileSync(SOURCE_PATH, "utf8");
  source = source.replace(/^\/\* eslint-disable \*\/\n/, "");
  source = source.replace(/export const CUSTOMER_MASTER_DERIVED_MOCK = /, "globalThis.__DATA__ = ");

  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { timeout: 30000 });
  return context.globalThis.__DATA__;
}

function roundRobinSelect(rows, limit) {
  const groups = new Map();

  for (const row of rows) {
    const key = [row.date, row.type, row.stage, row.status, row.team].join("::");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const buckets = [...groups.entries()]
    .map(([key, items]) => ({ key, items: items.slice() }))
    .sort((a, b) => {
      const aDate = a.items[0]?.date ?? "";
      const bDate = b.items[0]?.date ?? "";
      return bDate.localeCompare(aDate, "ko") || a.key.localeCompare(b.key, "ko");
    })
    .map(({ items }) => items);

  const selected = [];
  while (selected.length < limit) {
    let progressed = false;
    for (const bucket of buckets) {
      if (!bucket.length || selected.length >= limit) continue;
      selected.push(bucket.shift());
      progressed = true;
    }
    if (!progressed) break;
  }

  return selected;
}

function buildSubset(data) {
  const selectedRows = roundRobinSelect(data.requestRows, REQUEST_LIMIT);
  const selectedRequestIds = new Set(selectedRows.map((row) => row.id));
  const selectedRequests = data.requests.filter((request) => selectedRequestIds.has(request.id));
  const selectedCustomerIds = new Set(selectedRequests.map((request) => request.customerId));

  return {
    customers: data.customers.filter((customer) => selectedCustomerIds.has(customer.id)),
    requests: selectedRequests,
    consultations: data.consultations.filter((item) => selectedCustomerIds.has(item.customerId)),
    meetings: data.meetings.filter((item) => selectedCustomerIds.has(item.customerId)),
    meetingExecutionQueue: data.meetingExecutionQueue.filter((item) => selectedCustomerIds.has(item.customerId)),
    claimsQueue: data.claimsQueue.filter((item) => selectedRequestIds.has(item.requestId)),
    requestRows: selectedRows,
  };
}

function writeSubset(subset) {
  const banner = [
    "/* eslint-disable */",
    "// App-optimized realistic mock subset for demo/training",
    `// Source: ${path.relative(process.cwd(), SOURCE_PATH)}`,
    `// Selected request rows: ${subset.requestRows.length}`,
    "",
    `export const CUSTOMER_MASTER_DERIVED_MOCK = ${JSON.stringify(subset, null, 2)};`,
    "",
  ].join("\n");

  fs.writeFileSync(OUTPUT_PATH, banner);
}

const generated = loadGeneratedMock();
const subset = buildSubset(generated);
writeSubset(subset);
console.log(`wrote ${OUTPUT_PATH}`);

const requestDates = subset.requestRows.map((row) => row.date).sort();
const distinct = (items) => new Set(items.filter(Boolean)).size;
console.log(
  JSON.stringify(
    {
      customers: subset.customers.length,
      requests: subset.requests.length,
      consultations: subset.consultations.length,
      meetings: subset.meetings.length,
      meetingExecutionQueue: subset.meetingExecutionQueue.length,
      claimsQueue: subset.claimsQueue.length,
      requestRows: subset.requestRows.length,
      uniqueDates: distinct(requestDates),
      uniqueStages: distinct(subset.requestRows.map((row) => row.stage)),
      uniqueStatuses: distinct(subset.requestRows.map((row) => row.status)),
      firstDate: requestDates[0] ?? null,
      lastDate: requestDates[requestDates.length - 1] ?? null,
    },
    null,
    2,
  ),
);
