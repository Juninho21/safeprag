import React, { useState, useEffect } from 'react';
import { Product } from '../types/product.types';
import { STORAGE_KEYS } from '../services/storageKeys';
import { AlertTriangle } from 'lucide-react';

interface ProductSelectorProps {
  onProductSelect: (product: Product) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ onProductSelect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Carregar produtos do localStorage
    const loadProducts = () => {
      try {
        const productsJson = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (productsJson) {
          const products: Product[] = JSON.parse(productsJson);
          setProducts(products);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos do localStorage:', error);
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      onProductSelect(selectedProduct);
    }
    setIsExpanded(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="relative">
      <div 
        className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Produtos Utilizados</h3>
          </div>
          <span className="text-blue-600">
            {selectedProductId ? products.find(p => p.id === selectedProductId)?.name : 'Selecione um produto'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {products.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              Nenhum produto cadastrado
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedProductId === product.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleProductSelect(product.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.activeIngredient}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{product.measure}</div>
                      <div>Validade: {formatDate(product.expirationDate)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Registro:</span> {product.registration}
                    <span className="mx-2">•</span>
                    <span className="font-medium">Lote:</span> {product.batch}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
