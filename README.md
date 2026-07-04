# 🌸 Prospeceve — CRM fofinho para desenvolvedores(as) web

Sistema completo de gestão de **clientes, projetos e financeiro** com estética
*plush / felt* (tecido, costuras, nuvens, flores e cores pastel).
Feito **100% em HTML5, CSS3 e JavaScript puro (Vanilla)** — sem nenhum framework,
biblioteca externa ou build. É só abrir e usar.

---

## ▶️ Como usar

1. Descompacte a pasta `prospeceve`.
2. Abra o arquivo **`index.html`** com um duplo clique (Chrome, Edge, Firefox…).
3. Pronto! Os dados ficam salvos automaticamente no seu navegador (LocalStorage).

> A fonte *Quicksand* é carregada da web quando há internet; sem internet, o
> sistema usa uma fonte arredondada do próprio sistema como alternativa.

---

## 🗂️ Estrutura de arquivos

```
prospeceve/
├── index.html            → estrutura da SPA + tela de carregamento
├── css/
│   ├── style.css         → tokens, fundo de céu, texturas, sidebar e topo
│   ├── components.css     → cartões, botões, formulários, modais, tabelas…
│   ├── animations.css     → loading, nuvens e micro-animações
│   └── responsive.css     → desktop · notebook · tablet · celular
├── js/
│   ├── utils.js          → funções utilitárias (moeda, datas, toasts…)
│   ├── storage.js        → persistência em LocalStorage + dados de exemplo
│   ├── notifications.js  → alertas (pagamentos, follow-ups, domínios…)
│   ├── dashboard.js      → painel inicial + gráfico de faturamento (canvas)
│   ├── clients.js        → CRUD de clientes, ficha completa, proposta…
│   ├── projects.js       → projetos, timeline de etapas e checklist
│   ├── financial.js      → pagamentos e totais automáticos
│   ├── calendar.js       → calendário mensal com eventos
│   ├── reports.js        → relatórios e gráficos
│   ├── files.js          → registro de arquivos por cliente
│   ├── settings.js       → perfil, tema e backup (exportar/importar)
│   ├── router.js         → roteador SPA por hash (#/rota)
│   └── app.js            → inicialização, topo, busca e tema
└── assets/               → icons · images · fonts (para seus próprios arquivos)
```

---

## ✨ Funcionalidades

- **Dashboard** com 8 indicadores, gráfico de faturamento, progresso dos
  projetos, projetos e atividades recentes.
- **Clientes**: ficha completa (contato, endereço, redes, origem do lead,
  follow-ups), 12 status, **proposta**, **domínio** e **manutenção**.
- **Projetos**: timeline com 11 etapas (clique para avançar o status) e
  **checklist de publicação** com 13 itens.
- **Financeiro**: pagamentos, parcelas, formas de pagamento e totais
  automáticos (recebido, pendente, lucro do mês e do ano).
- **Calendário** mensal reunindo pagamentos, entregas, follow-ups e renovações.
- **Relatórios** de clientes por status, faturamento por forma, produção e
  resumo financeiro (com botão de imprimir).
- **Arquivos** por cliente.
- **Busca global** instantânea no topo.
- **Notificações** calculadas automaticamente.
- **Tema claro/escuro**, **backup** (exportar/importar `.json`) e reset.
- **SPA** sem recarregar a página, totalmente **responsivo** e com
  acessibilidade (foco visível, navegação por teclado, `prefers-reduced-motion`).

---

## 💾 Sobre os dados

Tudo é salvo no **LocalStorage do navegador**. Isso significa que os dados ficam
apenas naquele computador/navegador. Use **Configurações → Exportar backup**
regularmente para guardar uma cópia, e **Importar backup** para restaurar ou
levar os dados para outro computador.

Para começar do zero: **Configurações → Apagar tudo**.
Para voltar aos dados de exemplo: **Configurações → Recarregar dados de exemplo**.

---

Feito com carinho, tecido e nuvens. 🧵☁️🌷
