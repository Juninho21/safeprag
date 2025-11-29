import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, saveCompany } from '../../services/companyService';
import type { Company } from '../../types/company.types';
import { Button } from '../ui/button';
import { RequireRole } from '../Auth/RequireRole';
import { Upload, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompanySettings() {
    const { companyId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<Company | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Campos do formulário
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');

    // Carregar dados da empresa
    useEffect(() => {
        async function loadCompany() {
            if (!companyId) {
                setError('Você não está associado a nenhuma empresa');
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const data = await getCompany(companyId);
                if (data) {
                    setCompany(data);
                    setName(data.name || '');
                    setCnpj(data.cnpj || '');
                    setPhone(data.phone || '');
                    setAddress(data.address || '');
                    setEmail(data.email || '');
                    setLogoPreview(data.logo_url || null);
                }
            } catch (e: any) {
                setError(e?.message || 'Erro ao carregar dados da empresa');
            } finally {
                setLoading(false);
            }
        }

        loadCompany();
    }, [companyId]);

    // Preview da logo quando arquivo é selecionado
    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Importar utilitários de imagem
                const { validateImageSize, getImageInfo, generateImagePreview } = await import('../../utils/imageUtils');

                // Validar tamanho
                validateImageSize(file);

                // Obter informações da imagem
                const info = await getImageInfo(file);
                console.log(`📸 Imagem selecionada: ${info.width}x${info.height}px, ${(info.size / 1024).toFixed(1)}KB`);

                // Gerar preview
                const preview = await generateImagePreview(file);
                setLogoPreview(preview);
                setLogoFile(file);

                // Limpar mensagens
                setError(null);
                setSuccess(null);
            } catch (err: any) {
                setError(err.message || 'Erro ao processar imagem');
                setLogoFile(null);
                setLogoPreview(null);
            }
        }
    };

    // Salvar alterações
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) {
            setError('Você não está associado a nenhuma empresa');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await saveCompany(
                companyId,
                { name, cnpj, phone, address, email },
                logoFile
            );

            setSuccess('Dados da empresa atualizados com sucesso!');
            setLogoFile(null);

            // Recarregar dados
            const updatedData = await getCompany(companyId);
            if (updatedData) {
                setCompany(updatedData);
                setLogoPreview(updatedData.logo_url || null);
            }
        } catch (e: any) {
            setError(e?.message || 'Erro ao salvar dados da empresa');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Carregando...</div>
            </div>
        );
    }

    return (
        <RequireRole allow={["admin"]}>
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold text-gray-900">Configurações da Empresa</h2>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Logo Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Logo da Empresa
                            </label>
                            <div className="flex items-center gap-6">
                                {logoPreview && (
                                    <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                                        <img
                                            src={logoPreview}
                                            alt="Logo da empresa"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span>Selecionar Logo</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">
                                        PNG, JPG ou GIF (máx. 2MB)
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        ✨ Otimização automática: compressão e conversão para WebP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome da Empresa *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nome da empresa"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CNPJ *
                                </label>
                                <input
                                    type="text"
                                    value={cnpj}
                                    onChange={(e) => setCnpj(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="00.000.000/0001-00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="contato@empresa.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Endereço
                            </label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Endereço completo da empresa"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="px-6"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Company Info Display */}
                {company && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Informações do Sistema</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="font-medium">ID da Empresa:</span> {company.id}</p>
                            <p><span className="font-medium">Criada em:</span> {company.created_at ? new Date(company.created_at?.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            <p><span className="font-medium">Última atualização:</span> {company.updated_at ? new Date(company.updated_at?.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        </div>
                    </div>
                )}
            </div>
        </RequireRole>
    );
}
