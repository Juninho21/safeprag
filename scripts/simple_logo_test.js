// Script simples para testar a URL do logo
const logoUrl = 'https://badyvhzrjbemyqzeqlaw.supabase.co/storage/v1/object/public/images//Sulpest.png';

console.log('🖼️ URL do logo:', logoUrl);

// Teste simples com fetch
fetch(logoUrl)
  .then(response => {
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    if (response.ok) {
      console.log('✅ Logo acessível!');
    } else {
      console.log('❌ Logo não acessível');
    }
  })
  .catch(error => {
    console.log('❌ Erro:', error.message);
  }); 