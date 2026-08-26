export type View = "overview" | "units" | "map" | "technical";

export type MoneyValue = {
  amount: number | null;
  label: string | null;
};

export type HealthUnitStatus = "Em funcionamento" | "Em construção" | "Não informado";

export type HealthUnit = {
  id: string;
  ibgeCode: string | null;
  name: string;
  municipality: string;
  sourceMunicipality: string | null;
  rd: string;
  geres: string;
  address: string | null;
  status: HealthUnitStatus;
  type: string;
  managementType: string | null;
  management: string | null;
  beds: number | null;
  plannedBeds: number | null;
  bedsOpenedInManagement: number | null;
  openedBedTypes: string | null;
  bedsToOpenAfterRenovation: number | null;
  profile: string | null;
  professionals: string | null;
  calledProfessionals: number | null;
  maintenanceContract: MoneyValue;
  managementInvestment: MoneyValue;
  constructionInvestment: MoneyValue;
  mainAdvances: string | null;
  latitude: number | null;
  longitude: number | null;
  source: {
    sheet: string;
    row: number;
    supplemental: { sheet: string; row: number } | null;
  };
  enrichment: {
    rd: string;
    geres: string;
    municipalityCorrected: boolean;
    investment: string;
    construction: string;
  };
};

export type DataQuality = {
  sourceFile: string;
  sourceSheet: string;
  sourceSheets: string[];
  generatedAt: string;
  sourceRows: number;
  constructionRows: number;
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
  possibleDuplicates: Array<{
    unitName: string;
    municipality: string;
    sourceRows: number[];
  }>;
  warnings: string[];
};

export type DashboardData = {
  meta: {
    title: string;
    sourceLabel: string;
    generatedAt: string;
    totalUnits: number;
    activeUnits: number;
    constructionUnits: number;
    unitsWithoutStatus: number;
    constructionMunicipalities: number;
    totalMunicipalities: number;
    totalBeds: number;
    unitsWithBeds: number;
    plannedBeds: number;
    constructionUnitsWithBeds: number;
    bedsOpenedInManagement: number;
    unitsWithBedsOpenedInManagement: number;
    bedsToOpenAfterRenovation: number;
    unitsWithBedsToOpenAfterRenovation: number;
    typeCounts: Record<string, number>;
    typeCountsByStatus: Record<string, Record<string, number>>;
    statusCounts: Record<string, number>;
  };
  filters: {
    municipalities: string[];
    rds: string[];
    geres: string[];
    types: string[];
    statuses: HealthUnitStatus[];
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
  status: string;
};
