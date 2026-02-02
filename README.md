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
Banco de Dados: Simulação via MongoDB ou arquivos JSON para foco na lógica de segurança.

4.Requisitos de Segurança
O projeto atende a diversos requisitos não funcionais (RNF) e funcionais (RF):
RNF-01: Validação rigorosa de assinaturas de tokens JWT.
RNF-06: Retenção e integridade dos logs de auditoria por períodos definidos para fins legais.
RF-02: Aplicação de restrição de campos baseada no perfil do usuário.
RF-04: Monitoramento de volume de dados para detecção de comportamento anômalo.

5.Conformidade e Normas
O SCAA foi projetado com foco em:
LGPD: Atua como medida técnica de proteção de dados e auxilia o Encarregado de Dados (DPO) na demonstração de conformidade.
ISO 27001: Alinhado aos controles de Gerenciamento de Acesso (A.9.4), Log e Monitoramento (A.12.4) e Disponibilidade (A.17).
