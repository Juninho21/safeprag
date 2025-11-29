const OS_COUNTER_KEY = 'safeprag_os_counter';

export const getNextOSNumber = (): number => {
  try {
    // Obter o último número do localStorage
    const currentCounter = localStorage.getItem(OS_COUNTER_KEY);
    let nextNumber = 1;

    if (currentCounter) {
      nextNumber = parseInt(currentCounter) + 1;
    }

    // Salvar o próximo número
    localStorage.setItem(OS_COUNTER_KEY, nextNumber.toString());

    return nextNumber;
  } catch (error) {
    console.error('Erro ao gerar número da OS:', error);
    return 1;
  }
};

export const resetOSCounter = (): void => {
  localStorage.setItem(OS_COUNTER_KEY, '0');
};

export const getCurrentOSNumber = (): number => {
  const currentCounter = localStorage.getItem(OS_COUNTER_KEY);
  return currentCounter ? parseInt(currentCounter) : 0;
};
