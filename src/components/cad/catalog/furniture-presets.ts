import type { Vec3 } from '../state/drawing-types';

export type FurnitureCategory = 'kitchen' | 'bathroom' | 'living' | 'bedroom';

export type FurniturePreset = {
  id: string;
  name: string;
  category: FurnitureCategory;
  dimensions: Vec3;
  color: string;
};

export const FURNITURE_PRESETS: FurniturePreset[] = [
  // Kitchen
  { id: 'kitchen-base-cabinet', name: 'Base Cabinet', category: 'kitchen', dimensions: { x: 0.6, y: 0.9, z: 0.6 }, color: '#8B7355' },
  { id: 'kitchen-island', name: 'Island', category: 'kitchen', dimensions: { x: 1.5, y: 0.9, z: 0.8 }, color: '#A0926B' },
  { id: 'kitchen-counter', name: 'Counter', category: 'kitchen', dimensions: { x: 2.0, y: 0.9, z: 0.6 }, color: '#C4B5A0' },
  { id: 'kitchen-sink', name: 'Sink', category: 'kitchen', dimensions: { x: 0.6, y: 0.9, z: 0.5 }, color: '#B0B0B0' },
  { id: 'kitchen-stove', name: 'Stove', category: 'kitchen', dimensions: { x: 0.6, y: 0.9, z: 0.6 }, color: '#2A2A2A' },
  { id: 'kitchen-fridge', name: 'Fridge', category: 'kitchen', dimensions: { x: 0.7, y: 1.8, z: 0.7 }, color: '#E0E0E0' },

  // Bathroom
  { id: 'bathroom-toilet', name: 'Toilet', category: 'bathroom', dimensions: { x: 0.4, y: 0.4, z: 0.7 }, color: '#F5F5F5' },
  { id: 'bathroom-vanity', name: 'Vanity', category: 'bathroom', dimensions: { x: 0.9, y: 0.8, z: 0.5 }, color: '#D4A574' },
  { id: 'bathroom-bathtub', name: 'Bathtub', category: 'bathroom', dimensions: { x: 1.7, y: 0.6, z: 0.7 }, color: '#F0F0F0' },
  { id: 'bathroom-shower', name: 'Shower', category: 'bathroom', dimensions: { x: 0.9, y: 2.1, z: 0.9 }, color: '#E8E8E8' },

  // Living
  { id: 'living-sofa', name: 'Sofa', category: 'living', dimensions: { x: 2.0, y: 0.8, z: 0.9 }, color: '#6B7B8D' },
  { id: 'living-coffee-table', name: 'Coffee Table', category: 'living', dimensions: { x: 1.2, y: 0.45, z: 0.6 }, color: '#8B6914' },
  { id: 'living-armchair', name: 'Armchair', category: 'living', dimensions: { x: 0.8, y: 0.8, z: 0.8 }, color: '#7B8B6B' },
  { id: 'living-bookshelf', name: 'Bookshelf', category: 'living', dimensions: { x: 1.0, y: 1.8, z: 0.3 }, color: '#A0522D' },

  // Bedroom
  { id: 'bedroom-queen-bed', name: 'Queen Bed', category: 'bedroom', dimensions: { x: 1.5, y: 0.5, z: 2.0 }, color: '#C4A882' },
  { id: 'bedroom-nightstand', name: 'Nightstand', category: 'bedroom', dimensions: { x: 0.5, y: 0.5, z: 0.4 }, color: '#8B7355' },
  { id: 'bedroom-dresser', name: 'Dresser', category: 'bedroom', dimensions: { x: 1.2, y: 0.9, z: 0.5 }, color: '#A0926B' },
  { id: 'bedroom-desk', name: 'Desk', category: 'bedroom', dimensions: { x: 1.2, y: 0.75, z: 0.6 }, color: '#D2B48C' },
];

export function getFurniturePreset(id: string): FurniturePreset | undefined {
  return FURNITURE_PRESETS.find((p) => p.id === id);
}

export function getFurnitureByCategory(category: FurnitureCategory): FurniturePreset[] {
  return FURNITURE_PRESETS.filter((p) => p.category === category);
}
