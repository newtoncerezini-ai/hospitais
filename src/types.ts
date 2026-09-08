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
  cofinancing2022: MoneyValue;
  cofinancing2025: MoneyValue;
  cofinancingIncreasePercent: number | null;
  osTransfer2025: MoneyValue;
  worksAndEquipmentInvestment: MoneyValue;
  professionalBreakdown: {
    servers: number | null;
    commissioned: number | null;
    clt: number | null;
    pj: number | null;
    outsourced: number | null;
    youngApprentices: number | null;
    temporaryContracts: number | null;
    secondedFromOtherAgencies: number | null;
  };
  mainAdvances: string | null;
  sourceText: string | null;
  latitude: number | null;
  longitude: number | null;
  source: {
    sheet: string;
    row: number;
    supplemental: { sheet: string; row: number } | null;
    references: Array<{ sheet: string; row: number }>;
    inheritedFields: string[];
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
  sourceSha256: string;
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
  formulaErrors: Array<{
    sheet: string;
    cell: string;
    unitName: string;
    error: string;
  }>;
};

export type DashboardData = {
  meta: {
    title: string;
    sourceLabel: string;
    generatedAt: string;
    sourceUrl: string | null;
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
    cofinancing2022: number;
    unitsWithCofinancing2022: number;
    cofinancing2025: number;
    unitsWithCofinancing2025: number;
    osTransfers2025: number;
    unitsWithOsTransfers2025: number;
    worksAndEquipmentInvestment: number;
    unitsWithWorksAndEquipmentInvestment: number;
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
  municipality: string[];
  rd: string[];
  geres: string[];
  type: string[];
  status: string[];
};
