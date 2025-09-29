// Script simples para verificar se o logo está sendo carregado corretamente
console.log('🔍 Verificando se o logo está sendo carregado...');

// URL do logo que deve estar no banco
const expectedLogoUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png';

console.log('🖼️ URL esperada:', expectedLogoUrl);

// Testar se a URL está acessível
fetch(expectedLogoUrl)
  .then(response => {
    console.log('📊 Status da resposta:', response.status);
    console.log('✅ Logo acessível:', response.ok);
    
    if (response.ok) {
      console.log('📋 Content-Type:', response.headers.get('content-type'));
      console.log('📏 Tamanho:', response.headers.get('content-length'), 'bytes');
      console.log('✅ A URL do logo está funcionando corretamente!');
    } else {
      console.log('❌ Problema com a URL do logo');
    }
  })
  .catch(error => {
    console.log('❌ Erro ao acessar logo:', error.message);
  });

console.log('\n📋 Para verificar se o logo aparece na interface:');
console.log('1. Abra o console do navegador (F12)');
console.log('2. Vá para a aba empresa');
console.log('3. Procure por mensagens como:');
console.log('   - 🖼️ Logo URL sendo passada para ImageUpload:');
console.log('   - 🖼️ ImageUpload recebeu URL:');
console.log('   - 🖼️ Definindo preview URL:');
console.log('\n4. Se a URL estiver vazia ou incorreta, execute no Supabase:');
console.log('   UPDATE company SET logo_url = \'' + expectedLogoUrl + '\' WHERE name = \'Sulpest\';'); 