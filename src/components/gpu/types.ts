import { Colord } from "colord";

export type GPUState = {
  context: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
};

export type SimulationConfig = {
  variantA: VariantConfig;
  variantB: VariantConfig;
  variantC: VariantConfig;
}

export type VariantConfig = {
  color: Colord;
  sampleAngle: number;
  sampleDistance: number;
  speed: number;
  interactionsLocked: boolean;
  interactions: {
    a: number;
    b: number;
    c: number;
    alpha: number;
  }
}
