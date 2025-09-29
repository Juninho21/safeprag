import { cpf, cnpj } from 'cpf-cnpj-validator';

export const validateDocument = (doc: string): boolean => {
  // Remove caracteres não numéricos
  const cleanDoc = doc.replace(/\D/g, '');
  
  // Verifica se é CPF ou CNPJ baseado no tamanho
  if (cleanDoc.length === 11) {
    return cpf.isValid(cleanDoc);
  } else if (cleanDoc.length === 14) {
    return cnpj.isValid(cleanDoc);
  }
  
  return false;
};

export const formatDocument = (doc: string): string => {
  const cleanDoc = doc.replace(/\D/g, '');
  
  if (cleanDoc.length === 11) {
    return cpf.format(cleanDoc);
  } else if (cleanDoc.length === 14) {
    return cnpj.format(cleanDoc);
  }
  
  return doc;
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  return phone;
};

export const formatCEP = (cep: string): string => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

export const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};
