export interface VariantAttributes {
  size?: string;
  color?: string;
  material?: string;
  [key: string]: string | undefined;
}

export type VariantTypes = (keyof VariantAttributes)[];