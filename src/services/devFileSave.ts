export async function saveBackupJsonToPublic(fileName: string, content: string): Promise<{ success: boolean; path?: string; error?: string }>{
  try {
    const res = await fetch('/api/save-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content })
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao salvar JSON na pasta public' };
  }
}