# Documento de Requisitos do Produto (PRD) - Sistema de Gestão de Controle de Pragas (Novo Projeto)

## 1. Visão Geral do Produto
O objetivo deste projeto é desenvolver uma plataforma robusta e multiplataforma (Web e Mobile) para o gerenciamento Multi Empresas de controle de pragas urbanas (dedetizadoras). O sistema visa digitalizar o fluxo de trabalho operacional, desde o agendamento de visitas até a execução de Ordens de Serviço (OS) e Certificados e Relatorios de Não Conformidade em campo, geração de relatórios e gestão administrativa, cada administrador pode cadastrar sua empresa, seu Responsável técnico com sua assinatura canva nos relatorios, bem como o cadastro e as assinaturas dos Controladores de pragas, produtos, clientes, com foco em funcionamento offline e sincronização em nuvem.


## 2. Objetivos Principais
*   **Digitalização Completa:** Eliminar o uso de papel para Ordens de Serviço e Certificados.
*   **Mobilidade:** Permitir que técnicos utilizem o sistema em campo via aplicativo móvel (Android/iOS), mesmo sem conexão com a internet.
*   **Gestão Centralizada:** Oferecer um painel administrativo para controle total de clientes, agendamentos, estoque e faturamento.
*   **Confiabilidade:** Garantir sincronização de dados segura entre o dispositivo local e a nuvem.

## 3. Público-Alvo
*   **Administradores:** Proprietários e gerentes que precisam de visão macro do negócio, relatórios financeiros e controle de equipes.
*   **Técnicos de Campo:** Profissionais que executam os serviços, necessitando de uma interface simples, rápida e que funcione offline.
*   **Clientes Finais:** Acesso a histórico de serviços, Download de relatórios e certificados via portal ou envio automático.

## 4. Escopo Funcional

### 4.1. Módulo Administrativo (Web/Desktop)
*   **Dashboard Intuitivo:** Visão geral de OSs do dia, faturamento mensal, status de atendimentos e alertas de estoque.
*   **Gestão de Clientes:** Cadastro completo (Pessoa Física/Jurídica), histórico de atendimentos e gestão de contratos.
*   **Gestão de Produtos:** Cadastro de insumos, controle de lotes, validade e ficha técnica (FISPQ/Manejo).
*   **Agendamento e Calendário:** Interface de calendário (drag-and-drop) para alocação de técnicos e serviços.
*   **Relatórios e BI:** Geração de gráficos de desempenho, vendas por período, serviços mais realizados.
*   **Configurações do Sistema:** Parametrização de dados da empresa, logotipos para relatórios, controle de usuários e permissões.

### 4.2. Módulo Operacional (App Mobile/Campo)
*   **Minha Agenda:** Visualização das OSs atribuídas ao técnico para o dia.
*   **Execução de Serviços (Fluxo de OS):**
    *   Check-in/Check-out (registro de tempo).
    *   Checklist de atividades (inspeção, identificação de pragas, aplicação).
    *   Registro de produtos utilizados (baixa automática de estoque).
    *   Evidências fotográficas (antes e depois) com upload.
    *   Mapeamento de armadilhas (Iscas/Dispositivos) com status (Consumida, Danificada, etc.).
*   **Assinatura Digital:** Coleta de assinatura do cliente na tela do dispositivo.
*   **Modo Offline:** Capacidade completa de criar e editar OSs sem internet, com fila de sincronização automática.
*   **Impressão/Envio:** Geração automática do Relatório de Execução e Certificado de Execução (PDF) e envio por WhatsApp/E-mail.

### 4.3. Módulo Financeiro & Assinaturas
*   **Planos de Assinatura (SaaS):** Integração com Stripe para gestão de assinaturas do próprio software (Básico, Pro, Enterprise).
*   **Billing:** Geração de links de pagamento para cobrança de clientes finais (opcional).

## 5. Requisitos Não Funcionais
*   **Compatibilidade:** Web (Navegadores modernos), Android (via Capacitor) e iOS.
*   **Performance:** Carregamento inicial rápido (< 2s) e transições fluídas no app móvel.
*   **Segurança:** Autenticação robusta, criptografia de dados sensíveis e regras de acesso (RAG) no banco de dados.
*   **Escalabilidade:** Arquitetura preparada para suportar múltiplas empresas (Multi-tenant).

## 6. Arquitetura e Stack Tecnológico Sugerido

### Frontend
*   **Framework:** React 18+ com TypeScript.
*   **Build Tool:** Vite (para performance de desenvolvimento).
*   **UI Library:** TailwindCSS (estilização) + Shadcn/UI ou Radix UI (componentes acessíveis).
*   **Ícones:** Lucide React.
*   **Gerenciamento de Estado:** React Query (TanStack Query) para server state + Zustand para client state.

### Mobile
*   **Framework Híbrido:** Capacitor 6+ (mantendo a base de código web).
*   **Plugins Essenciais:** Camera, Filesystem, Geolocation, Share, Network Status.

### Backend & BaaS (Backend as a Service)

*    **Firebase**.
    *   Banco: Firestore.
    *   Auth: Firebase Auth.
    *   Functions: Serverless para lógicas complexas.

### Ferramentas Auxiliares
*   **Geração de PDF:** `pdf-lib` ou `react-pdf`.
*   **Datas:** `date-fns`.
*   **Validação:** `Zod`.
*   **Formulários:** `React Hook Form`.

## 7. Estrutura de Dados (Entidades Principais)
*   `Users`: Perfis de acesso (Admin, Técnico).
*   `Clients`: Dados cadastrais e endereços.
*   `ServiceOrders`: Cabeçalho da OS (Data, Status, Cliente).
*   `ServiceOrderItems`: Detalhes (Pragas alvo, Locais tratados).
*   `Products`: Inventário.
*   `ProductUsage`: Relacionamento N:N entre OS e Produtos (consumo).
*   `Devices`: Armadilhas/Dispositivos monitorados.
*   `DeviceInspections`: Histórico de monitoramento de cada dispositivo.

## 8. Roadmap de Implementação
1.  **Fase 1 (MVP):** Autenticação, CRUD de Clientes/Produtos, Criação de OS Simples, PDF básico.
2.  **Fase 2 (Mobile):** Integração Capacitor, Modo Offline, Câmera e Assinatura.
3.  **Fase 3 (Gestão):** Dashboard, Relatórios Avançados, Controle de Estoque automático.
4.  **Fase 4 (SaaS):** Integração com Stripe e Isolamento de dados por Tenant (Empresa).
