import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, AlertCircle } from 'lucide-react';
// import { toast } from 'react-toastify';
import { productDataService } from '../services/dataService';
import { Product } from '../types/product.types';

export const ProductForm: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState<Product>({
    id: '',
    name: '',
    activeIngredient: '',
    chemicalGroup: '',
    registration: '',
    batch: '',
    expirationDate: '',
    measure: 'ml',
    diluent: ''
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadedProducts = await productDataService.getProducts();
        setProducts(loadedProducts);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setError('Erro ao carregar produtos. Verifique sua conexão com a internet.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let savedProduct: Product;
      
      if (editMode) {
        // Atualizar produto existente
        savedProduct = await productDataService.saveProduct(product);
        const updatedProducts = products.map(p => 
          p.id === product.id ? savedProduct : p
        );
        setProducts(updatedProducts);
        console.log('Produto atualizado com sucesso!');
      } else {
        // Adicionar novo produto (deixar o Supabase gerar o UUID automaticamente)
        const newProduct = {
          ...product,
          id: '' // Deixar vazio para o Supabase gerar UUID
        };
        savedProduct = await productDataService.saveProduct(newProduct);
        setProducts(prev => [...prev, savedProduct]);
        console.log('Produto cadastrado com sucesso!');
      }

      // Limpar o formulário
      setProduct({
        id: '',
        name: '',
        activeIngredient: '',
        chemicalGroup: '',
        registration: '',
        batch: '',
        expirationDate: '',
        measure: 'ml',
        diluent: ''
      });
      setEditMode(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setError('Erro ao salvar produto. Verifique sua conexão com a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productToEdit: Product) => {
    setProduct(productToEdit);
    setEditMode(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setLoading(true);
      setError(null);
      try {
        await productDataService.deleteProduct(productId);
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        console.log('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        setError('Erro ao excluir produto. Verifique sua conexão com a internet.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{editMode ? 'Editar Produto' : 'Cadastro de Produtos'}</h2>
          
          {/* Mensagem de erro */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          {/* Indicador de carregamento */}
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-blue-700">Processando...</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome do produto/concentração
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="activeIngredient" className="block text-sm font-medium text-gray-700">
                Princípio ativo
              </label>
              <input
                type="text"
                id="activeIngredient"
                name="activeIngredient"
                value={product.activeIngredient}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="chemicalGroup" className="block text-sm font-medium text-gray-700">
                Grupo químico
              </label>
              <input
                type="text"
                id="chemicalGroup"
                name="chemicalGroup"
                value={product.chemicalGroup}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="registration" className="block text-sm font-medium text-gray-700">
                Registro
              </label>
              <input
                type="text"
                id="registration"
                name="registration"
                value={product.registration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
                Lote
              </label>
              <input
                type="text"
                id="batch"
                name="batch"
                value={product.batch}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                Validade
              </label>
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={product.expirationDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="measure" className="block text-sm font-medium text-gray-700">
                Unidade
              </label>
              <select
                id="measure"
                name="measure"
                value={product.measure}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="ml">ml</option>
                <option value="g">g</option>
              </select>
            </div>

            <div>
              <label htmlFor="diluent" className="block text-sm font-medium text-gray-700">
                Diluente
              </label>
              <input
                type="text"
                id="diluent"
                name="diluent"
                value={product.diluent}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {editMode ? 'Atualizar Produto' : 'Cadastrar Produto'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Produtos */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Produtos Cadastrados</h2>
          <div className="space-y-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Princípio ativo:</span> {p.activeIngredient}</p>
                  <p><span className="font-medium">Grupo químico:</span> {p.chemicalGroup}</p>
                  <p><span className="font-medium">Registro:</span> {p.registration}</p>
                  <p><span className="font-medium">Lote:</span> {p.batch}</p>
                  <p><span className="font-medium">Validade:</span> {new Date(p.expirationDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">Unidade:</span> {p.measure}</p>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum produto cadastrado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
