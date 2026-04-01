import { CUSTOMER_MASTER_DERIVED_MOCK as GENERATED_CUSTOMER_MASTER_DERIVED_MOCK } from '@/app/mockData/generated/customerMasterDerived.app';

const SOURCE_BASE_DATE = '2026-03-13';

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shiftDateToken(token: string, dayDiff: number) {
  const normalized = token.replace(/\./g, '-');
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return token;
  }

  date.setDate(date.getDate() + dayDiff);
  const shifted = toLocalDateString(date);
  return token.includes('.') ? shifted.replace(/-/g, '.') : shifted;
}

function shiftStringDates(value: string, dayDiff: number) {
  return value.replace(/\d{4}[.-]\d{2}[.-]\d{2}/g, (token) => shiftDateToken(token, dayDiff));
}

function normalizeMockDates<T>(value: T, dayDiff: number): T {
  if (typeof value === 'string') {
    return shiftStringDates(value, dayDiff) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeMockDates(item, dayDiff)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeMockDates(item, dayDiff)])
    ) as T;
  }

  return value;
}

function getDayDiffFromToday() {
  const source = new Date(`${SOURCE_BASE_DATE}T00:00:00`);
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - source.getTime()) / (1000 * 60 * 60 * 24));
}

export const CUSTOMER_MASTER_DERIVED_MOCK = normalizeMockDates(
  GENERATED_CUSTOMER_MASTER_DERIVED_MOCK,
  getDayDiffFromToday(),
);
