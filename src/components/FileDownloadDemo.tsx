import React, { useState } from 'react';
import FileDownloadService from '../services/fileDownloadService';
import { Directory } from '@capacitor/filesystem';

const FileDownloadDemo: React.FC = () => {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  const handleDownload = async () => {
    if (!downloadUrl || !filename) {
      alert('Por favor, preencha a URL e o nome do arquivo');
      return;
    }

    setIsDownloading(true);
    try {
      const uniqueFilename = FileDownloadService.generateUniqueFilename(filename);
      await FileDownloadService.downloadFile({
        url: downloadUrl,
        filename: uniqueFilename,
        directory: Directory.Documents,
        showToast: true
      });
      
      // Atualiza a lista de arquivos
      await loadFiles();
      
      setDownloadUrl('');
      setFilename('');
    } catch (error) {
      console.error('Erro no download:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const fileList = await FileDownloadService.listFiles(Directory.Documents);
      setFiles(fileList);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  const handleShareFile = async (file: any) => {
    try {
      await FileDownloadService.shareFile({
        title: 'Compartilhar arquivo',
        text: `Arquivo: ${file.name}`,
        files: [file.uri]
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (confirm(`Deseja realmente excluir o arquivo ${file.name}?`)) {
      try {
        await FileDownloadService.deleteFile(file.name, Directory.Documents);
        await loadFiles();
      } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
      }
    }
  };

  React.useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Download e Compartilhamento de Arquivos</h2>
      
      {/* Formulário de Download */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Fazer Download</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Arquivo
            </label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://exemplo.com/arquivo.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="documento.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading || !downloadUrl || !filename}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloading ? 'Fazendo Download...' : 'Fazer Download'}
          </button>
        </div>
      </div>

      {/* Lista de Arquivos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Arquivos Baixados</h3>
          <button
            onClick={loadFiles}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Atualizar
          </button>
        </div>
        
        {files.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum arquivo encontrado</p>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Tamanho: {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'N/A'}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleShareFile(file)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Compartilhar
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações sobre Permissões */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">Permissões Necessárias</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Armazenamento externo (para Android 10 e anteriores)</li>
          <li>• Acesso a mídia (para Android 11+)</li>
          <li>• Internet (para downloads)</li>
          <li>• Compartilhamento de arquivos</li>
        </ul>
      </div>
    </div>
  );
};

export default FileDownloadDemo; 