SalvaFood

Ecossistema de Inteligência Artificial para Gestão de Resíduos Alimentares e Segurança Nutricional

Visão Geral

O SalvaFood é uma plataforma digital que utiliza Inteligência Artificial em estágio inicial para reduzir o desperdício de alimentos no varejo, conectando excedentes alimentares a consumidores locais e a instituições sociais. A solução foi desenvolvida como um protótipo funcional, com foco em impacto social, ambiental e econômico, alinhado às diretrizes do edital GO.IA – Goiás Aberto para Inteligência Artificial.

Problema

No Estado de Goiás, grandes volumes de alimentos próprios para consumo são descartados diariamente, enquanto parte da população enfrenta insegurança alimentar. Pequenos e médios comerciantes não dispõem de ferramentas tecnológicas para prever excedentes nem de mecanismos seguros e automatizados para a doação desses alimentos, o que resulta em perdas econômicas e impactos ambientais negativos.

Solução Proposta

O SalvaFood atua em três frentes integradas:

Prevenção do desperdício por meio da criação de sacolas surpresa com preços reduzidos.

Comercialização geolocalizada de excedentes alimentares para consumidores finais.

Destinação social automatizada de alimentos não vendidos, por meio do módulo Food Day.

Uso de Inteligência Artificial

A plataforma incorpora Inteligência Artificial em sua forma inicial, baseada em regras heurísticas e lógica de decisão automatizada. O sistema analisa dados operacionais como horário, tipo de alimento, validade e histórico básico de vendas para:

Sugerir a quantidade de sacolas surpresa.

Definir automaticamente o encerramento do ciclo de venda.

Acionar o módulo Food Day para doação.

Priorizar instituições sociais com base em critérios como proximidade geográfica, tipos de alimentos aceitos e horário de funcionamento.

A evolução prevista da solução inclui a implementação de modelos de aprendizado de máquina para previsão de demanda e otimização contínua da tomada de decisão.

Módulo Food Day

O Food Day é uma funcionalidade de inovação social integrada ao sistema. Quando um alimento não é comercializado até o horário limite, o sistema altera automaticamente seu status para doação prioritária, seleciona uma instituição social cadastrada e registra a confirmação da doação. O processo garante rastreabilidade, segurança jurídica e impacto social contínuo.

Estágio de Maturidade Tecnológica

O projeto encontra-se em estágio de maturidade tecnológica entre TRL 4 e TRL 5, contando com:

Protótipo funcional desenvolvido em ambiente low-code.

Telas de cadastro, login, sacola surpresa e fluxo de doação.

Validação inicial em ambiente relevante.

Tecnologias Utilizadas

React

TypeScript

Tailwind CSS

Supabase

Plataforma Lovable

GitHub para versionamento

Próximos Passos

Implementação de modelos preditivos de Inteligência Artificial.

Criação de painel administrativo e painel do comerciante.

Ampliação do módulo Food Day.

Escalonamento da solução para o Estado de Goiás.

Evidências do Projeto

Protótipo funcional sincronizado com o repositório.

Prints das principais telas do sistema.

Documentação técnica e anexo explicativo sobre o uso de Inteligência Artificial.

Instruções de Execução Local

Este projeto foi desenvolvido utilizando a plataforma Lovable e sincronizado automaticamente com o GitHub. O código disponível neste repositório representa a estrutura do frontend da aplicação.

Pré-requisitos

Antes de iniciar, é necessário ter instalado:

Node.js (versão 18 ou superior)

npm ou yarn

Instalação

Clone o repositório e instale as dependências:

git clone https://github.com/angelmrocha/save-food-locally.git
cd save-food-locally
npm install

Execução em Ambiente de Desenvolvimento

Para iniciar a aplicação localmente:

npm run dev


Após a execução, a aplicação estará disponível no navegador no endereço indicado no terminal (geralmente http://localhost:5173
).

Observações

Algumas funcionalidades dependem de configurações de backend e serviços externos (como Supabase), que não estão totalmente expostos neste repositório.

O protótipo funcional completo pode ser visualizado por meio do ambiente publicado pela plataforma Lovable.

Este repositório tem como objetivo principal demonstrar a estrutura técnica, o fluxo da aplicação e o estágio de maturidade do protótipo.
