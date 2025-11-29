import { Product } from '../types/product.types';

const PRODUCTS_STORAGE_KEY = 'safeprag_products';

// Função auxiliar para gerar ID único
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Obter todos os produtos
export const getProducts = (): Product[] => {
  const productsJson = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!productsJson) return [];
  return JSON.parse(productsJson);
};

// Adicionar novo produto
export const addProduct = (product: Omit<Product, 'id'>): Product => {
  const products = getProducts();
  const newProduct = {
    ...product,
    id: generateId()
  };
  products.push(newProduct);
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  return newProduct;
};

// Atualizar produto existente
export const updateProduct = (id: string, product: Partial<Product>): Product | null => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  products[index] = {
    ...products[index],
    ...product
  };
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  return products[index];
};

// Deletar produto
export const deleteProduct = (id: string): boolean => {
  const products = getProducts();
  const filteredProducts = products.filter(p => p.id !== id);
  if (filteredProducts.length === products.length) return false;
  
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filteredProducts));
  return true;
};

// Obter produto por ID
export const getProductById = (id: string): Product | null => {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
};

// Obter produto por nome
export const getProductByName = (name: string): Product | null => {
  const products = getProducts();
  return products.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
};
