// Script para testar se a URL do logo está acessível
const logoUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png';

console.log('🖼️ Testando URL do logo:', logoUrl);

// Criar uma imagem para testar se carrega
const img = new Image();
img.onload = () => {
  console.log('✅ Logo carregado com sucesso!');
  console.log('📏 Dimensões:', img.width, 'x', img.height);
};
img.onerror = () => {
  console.error('❌ Erro ao carregar logo');
  console.error('🔍 Verifique se:');
  console.error('   - A URL está correta');
  console.error('   - O arquivo existe no bucket');
  console.error('   - As permissões do bucket estão corretas');
};
img.src = logoUrl;

// Também testar com fetch
fetch(logoUrl)
  .then(response => {
    if (response.ok) {
      console.log('✅ Fetch do logo bem-sucedido');
      console.log('📋 Content-Type:', response.headers.get('content-type'));
      console.log('📏 Content-Length:', response.headers.get('content-length'));
    } else {
      console.error('❌ Fetch falhou:', response.status, response.statusText);
    }
  })
  .catch(error => {
    console.error('❌ Erro no fetch:', error);
  }); 