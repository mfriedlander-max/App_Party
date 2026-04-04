export type SafetyLevel = 'safe' | 'warning' | 'danger';

export interface SafetyAlert {
  id: string;
  level: SafetyLevel;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
}
