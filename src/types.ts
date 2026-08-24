export type View = "overview" | "units" | "map" | "technical";

export type MoneyValue = {
  amount: number | null;
  label: string | null;
};

export type HealthUnit = {
  id: string;
  ibgeCode: string | null;
  name: string;
  municipality: string;
  sourceMunicipality: string | null;
  rd: string;
  geres: string;
  address: string | null;
  status: string | null;
  type: string;
  managementType: string | null;
  management: string | null;
  beds: number | null;
  profile: string | null;
  professionals: string | null;
  calledProfessionals: number | null;
  maintenanceContract: MoneyValue;
  managementInvestment: MoneyValue;
  mainAdvances: string | null;
  latitude: number | null;
  longitude: number | null;
  source: { sheet: string; row: number };
  enrichment: {
    rd: string;
    geres: string;
    municipalityCorrected: boolean;
    investment: string;
  };
};

export type DataQuality = {
  sourceFile: string;
  sourceSheet: string;
  generatedAt: string;
  sourceRows: number;
  publishedUnits: number;
  municipalities: number;
  sourceCoverage: Record<string, number>;
  enrichment: Record<string, number>;
  corrections: Array<{
    sourceRow: number;
    field: string;
    sourceValue: string | null;
    normalizedValue: string;
    reason: string;
    evidenceUrl?: string;
  }>;
  warnings: string[];
};

export type DashboardData = {
  meta: {
    title: string;
    sourceLabel: string;
    generatedAt: string;
    totalUnits: number;
    totalMunicipalities: number;
    totalBeds: number;
    unitsWithBeds: number;
    typeCounts: Record<string, number>;
  };
  filters: {
    municipalities: string[];
    rds: string[];
    geres: string[];
    types: string[];
  };
  units: HealthUnit[];
  map: {
    viewBox: string;
    paths: Record<string, string>;
    fallbackCenters?: Record<string, Point & { label?: string }>;
  };
  dataQuality: DataQuality;
};

type Point = { x: number; y: number };

export type Filters = {
  query: string;
  municipality: string;
  rd: string;
  geres: string;
  type: string;
};
