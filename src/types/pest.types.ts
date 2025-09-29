export interface Pest {
  name: string;
  count: number;
}

export interface DevicePestCount {
  deviceType: string;
  deviceNumber: number;
  pests: Pest[];
}