export interface ProgramPriceLine {
  programPlanId: number;
  label: string;
  note?: string;
}

export interface Program {
  id: string;
  name: string;
  subtitle: string;
  prices: ProgramPriceLine[];
  features: string[];
  badge?: string;
}
