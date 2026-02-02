SCAA - Sistema de Controle de Acesso e Auditoria de API
O SCAA (Sistema de Controle de Acesso e Auditoria) é uma solução de segurança desenvolvida para atuar como um "guarda-costas digital" para interfaces de programação (APIs).
O objetivo central é proteger dados confidenciais contra acessos não autorizados e monitorar comportamentos internos suspeitos, garantindo a integridade e a conformidade das operações.

1.Visão geral e Objetivos:
-O sistema opera em duas frentes vitais de segurança:
Proteção Externa: Implementa autenticação rigorosa para barrar invasores que tentam explorar falhas técnicas na API.
Vigilância Interna: Monitora o comportamento de usuários legítimos (funcionários ou aplicações) para detectar acessos em volumes suspeitos, prevenindo vazamentos por má-fé ou negligência.
-O projeto baseia-se em pilares fundamentais da Segurança da Informação:
Princípio do Menor Privilégio: Usuários acessam apenas o estritamente necessário para sua função.
Defesa em Profundidade: Camadas extras de proteção (autenticação + auditoria + limitação de privilégios).
Accountability (Prestação de Contas): Rastreabilidade total sobre quem acessou quais dados e por quê, em conformidade com a LGPD.

2.Funcionalidades Principais:
Validação de Tokens JWT: Verificação de autenticidade e integridade em todas as requisições.
Controle Granular de Dados: Filtra os campos retornados pela API com base no nível de acesso do usuário (ex: oculta CPF ou dados sensíveis para usuários comuns).
Auditoria Contínua e Imutável: Registro detalhado de logs (quem, o quê, quando) protegidos contra modificações.
Detecção de Anomalias: Alertas automáticos quando um usuário excede um limite pré-configurado de consultas em um determinado intervalo.
Mascaramento de Dados nos Logs: Aplicação de anonimização para garantir que dados sensíveis não sejam expostos nos registros de auditoria.

3.Stack Técnica
Linguagem: JavaScript.
Ambiente de Execução: Node.js.
Comunicação: Criptografia TLS/SSL (HTTPS).
Banco de Dados: Simulação via MongoDB.

4.Requisitos de Segurança
O projeto atende a diversos requisitos não funcionais (RNF) e funcionais (RF):
RNF-01:
O SCAA deve validar rigorosamente a assinatura dos tokens JWT recebidos em todas as requisições de API para garantir a autenticidade e integridade da sessão.
RNF-02:
Todos os dados confidenciais (em trânsito) entre o SCAA e a API de backend devem ser criptografados usando TLS/SSL (HTTPS).
RNF-03:
O sistema deve registrar logs detalhados de todas as requisições de acesso a dados sensíveis (bem-sucedidas e falhas) no gateway SCAA.
RNF-04:
O SCAA deve ser submetido a um teste de Penetração (PenTest) simulando um ataque de Broken Access Control para verificar a efetividade da autorização.
RNF-05:
O SCAA deve operar em modo de "fail-safe" ou com replicação básica para garantir a Disponibilidade contínua das APIs, mesmo se uma instância do gateway falhar (ISO 27001 - A.17.2).
RNF-06:
Os logs de auditoria (RNF-03) devem ser protegidos contra modificação (Integridade) e armazenados por um período definido (ex: 1 ano) para cumprir requisitos de accountability da LGPD e ISO 27001 (A.12.4).
RNF-07:
Dados pessoais sensíveis (ex: CPF, dados de saúde) não devem ser registrados em logs de texto puro (plain text). O SCAA deve aplicar mascaramento ou anonimização nos logs (RNF-03) para aderir à Minimização de Dados (LGPD).

RF-01: O sistema deve validar e impor o acesso à API baseado em tokens de autenticação válidos (JWT).
RF-02: O sistema deve aplicar o Princípio do Menor Privilégio na API, restringindo os campos de dados que cada usuário pode visualizar.
RF-03: O sistema deve registrar todos os detalhes da requisição de acesso a dados (quem, o quê, quando) em um log de auditoria.
RF-04: O sistema deve alertar a equipe de segurança quando um usuário interno exceder um limite de volume de dados consultados na API (detecção de anomalia).
RF-05: O sistema deve prover uma interface (ou arquivo de configuração seguro) para que a Equipe de Segurança possa gerenciar as regras de acesso (RF-02) e os escopos de dados permitidos por usuário/grupo (ISO 27001 - A.9.4 Gerenciamento de Acesso).
RF-06: O sistema deve permitir que a Equipe de Segurança configure os limiares de detecção de anomalia (RF-04), como "N" requisições em "X" minutos, para balancear a detecção e evitar falsos positivos.


5.Conformidade e Normas
O SCAA foi projetado com foco em:
LGPD: Atua como medida técnica de proteção de dados e auxilia o Encarregado de Dados (DPO) na demonstração de conformidade.
ISO 27001: Alinhado aos controles de Gerenciamento de Acesso (A.9.4), Log e Monitoramento (A.12.4) e Disponibilidade (A.17).
