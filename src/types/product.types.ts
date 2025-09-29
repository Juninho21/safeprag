export interface Product {
  id: string;
  name: string;
  activeIngredient: string;
  chemicalGroup: string;
  registration: string;
  batch: string;
  expirationDate: string;
  measure: 'ml' | 'g';
  diluent: string;
}
