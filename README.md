# FonoLingo

Plataforma de aprendizagem gamificada para estudantes de Fonoaudiologia, em português brasileiro. A experiência combina preparação, prática, feedback, revisão de conceitos e evolução.

## Executar

Requisito: Node.js 24 ou superior (o backend usa `node:sqlite`).

```sh
npm install
npm run dev
```

Abra http://localhost:5188. O comando inicia a interface e a API na porta 3001. Configure a IA, crie uma conta e use dados reais de estudo.

### Uso pessoal no Windows

1. Execute `iniciar-fonolingo.cmd`.
2. No primeiro uso, o arquivo `.env` será criado. Informe nele a sua `GEMINI_API_KEY` e execute o iniciador novamente.
3. O navegador abrirá `http://localhost:3001`. A primeira pessoa cria a única conta permitida nesta instalação.

O progresso fica em `data/fonolingo.sqlite`. Use **Exportar progresso** periodicamente e guarde o JSON em um local seguro. O perfil também aceita **Importar backup** e valida o conteúdo no servidor antes de substituir os dados atuais.

Para servir a versão compilada:

```sh
npm run build
npm start
```

Abra http://localhost:3001. O servidor usa a interface de loopback; publicação externa exige configuração de hospedagem.

## Fluxo principal

1. Digite “Estou estudando disfagia” no dashboard.
2. Escolha Aprender ou Revisar, 10 atividades, nível Médio.
3. Responda atividades de múltipla escolha, verdadeiro/falso, lacunas, justificativas e casos simulados.
4. Veja resposta esperada, explicação, dica e link para consulta.
5. Conclua para registrar XP, aproveitamento por conceito e histórico.
6. Use “Revisar meus erros” para treinar apenas conceitos errados ou parciais com tarefas diferentes.

Respostas abertas e casos sem alternativas são avaliados semanticamente pela IA. Se a avaliação externa falhar, o sistema permite autoavaliação explícita com a rubrica gerada.

## IA opcional

Copie `.env.example` para `.env`, informe `GEMINI_API_KEY` e reinicie o servidor. `GEMINI_MODEL` é configurável; use um modelo disponível na sua conta com suporte a saídas estruturadas. A integração usa `@google/genai`, valida entradas e saídas com Zod, interpreta o pedido junto à geração da sessão e avalia justificativas semanticamente. A chave permanece no backend.

Documentação do fornecedor: [saídas estruturadas do Gemini](https://ai.google.dev/gemini-api/docs/structured-output).

A integração real foi validada com Gemini 3.5 Flash: geração de 10 questões em cinco formatos e avaliação de uma resposta esperada e de uma resposta sem conteúdo. O modelo é configurável porque a disponibilidade varia por conta. Falhas de geração e avaliação são apresentadas ao estudante, com opção explícita de autoavaliação quando a avaliação falha. Questões geradas não recebem referências inventadas nem selo de revisão acadêmica.

Para repetir a verificação com a API local em execução, rode `npm run check:ai`. Esse comando realiza três chamadas reais ao provedor e consome a cota da chave configurada. Ele fica fora dos testes automáticos comuns. O relatório local é salvo em `data/ai-verification.json`, sem a chave. O esquema enviado ao Gemini mantém a estrutura das questões; os limites completos continuam sendo validados no servidor.

## O que está implementado

- Interface responsiva com dashboard, seis áreas, perfil e todas as rotas principais.
- Cadastro único, login local, alteração de senha, senha derivada com scrypt, cookie HttpOnly/SameSite e sessões com expiração.
- SQLite para contas e progresso autenticado, com exportação JSON.
- Quatro modos de estudo, quantidade de 1 a 15 e três níveis cognitivos, com atividades geradas pela IA.
- Cinco formatos de desafio, explicações e rubricas, retomada de sessão, resultado e detalhamento de respostas.
- XP, níveis, conquistas, sequência por dias locais e meta diária configurável.
- Indicadores por conceito, dificuldades e revisão com novas tarefas.
- Entrada por voz com a Web Speech API quando suportada pelo navegador e autorizada pelo usuário.
- Revisão espaçada por conceito: erros retornam em um dia e intervalos de domínio crescem progressivamente até 30 dias.
- Lembretes com permissão explícita do navegador e instalação como PWA, com shell disponível offline.
- Limite diário configurável de chamadas à IA por conta ou IP (`AI_DAILY_LIMIT`) e endpoint `/api/health` para monitoramento.
- Navegação por teclado, foco visível, região de avisos, opção de movimento reduzido e feedback com texto/ícones.

## Estrutura

- `src/pages/`: dashboard, preparação, jogo, evolução e perfil em módulos separados.
- `src/components/`: componentes visuais, estrutura de navegação e entrada por texto/voz.
- `src/state/`: contexto da aplicação e catálogo de áreas e modos.
- `shared/scoring.mjs`: regras determinísticas de XP, precisão, sequência e lacunas.
- `server/index.mjs`: autenticação, persistência, validação e adaptador Gemini.
- `public/anatomy/`: 126 slides anatômicos renderizados e manifesto rastreável com origem, SHA-256, textos e coordenadas normalizadas dos objetos.
- `data/`: banco SQLite gerado localmente; não versionado.

Para adicionar um formato de jogo, estenda o tipo e o esquema de questão, o renderizador de atividade e a estratégia de avaliação. XP e histórico permanecem independentes do fornecedor de IA.

## Conteúdo acadêmico e limites de uso

As atividades geradas por IA ainda não passaram por revisão de um corpo docente. Os casos são simulados e os indicadores descrevem as atividades realizadas, não competência profissional.

Para produção institucional, publique política de privacidade e retenção, configure backups e observabilidade externa e mantenha a pontuação competitiva em regras autoritativas no servidor. A recuperação de senha só deve ser reativada depois da integração com um provedor real de e-mail.

Cada conta começa sem histórico e mantém seu próprio progresso no servidor. Até 200 sessões são preservadas por perfil. O tempo da sessão é o tempo decorrido, incluindo pausas. A revisão espaçada já funciona por calendário. O acervo SMART fornecido pelo responsável foi importado para a Biblioteca anatômica. A licença CC BY 4.0 aparece nas próprias lâminas e cada item mantém o hash da apresentação de origem. A declaração de revisão foi preservada como declaração do responsável; ainda não há nome e data de um revisor em cada slide. Marcação de regiões e drag and drop só serão habilitados em itens com alvos semânticos explícitos: muitas lâminas são imagens achatadas e as coordenadas do PowerPoint descrevem caixas e rótulos, não necessariamente a estrutura apontada. A IA não inventará esses alvos. A arte do dashboard continua sendo decorativa.

O tipo “Ache na imagem” está habilitado para 151 estruturas de 31 slides. O importador associa uma caixa de texto à linha mais próxima e usa a extremidade oposta como alvo, com tolerância geométrica conservadora. Sessões de temas compatíveis recebem atividades visuais automaticamente; os demais slides permanecem apenas na biblioteca. As questões visuais nunca são criadas livremente pela IA.

## Publicação no Netlify

O arquivo `netlify.toml` configura o frontend, a rota `/api/*`, a Netlify Function e o cache do acervo anatômico. No Netlify, a conta, as sessões e o progresso são persistidos em Netlify Blobs; no uso local, o Express continua usando SQLite.

1. Importe o repositório no Netlify. O comando de build e a pasta de publicação são lidos automaticamente de `netlify.toml`.
2. Em **Project configuration → Environment variables**, cadastre `GEMINI_API_KEY` e `OWNER_EMAIL` com o e-mail da única pessoa autorizada. Opcionalmente cadastre `GEMINI_MODEL` (padrão `gemini-3.5-flash`) e `AI_DAILY_LIMIT` (padrão `50`).
3. Faça o deploy e abra o domínio publicado. A primeira pessoa que concluir o cadastro cria a única conta permitida nessa instalação.

Não cadastre a chave como variável `VITE_*`, pois esse prefixo expõe o valor ao navegador. O primeiro cadastro aceita somente `OWNER_EMAIL` e usa uma gravação condicional para impedir a criação simultânea de duas contas. O Netlify instala as dependências durante o build, portanto não envie `node_modules`, `dist`, bancos locais, resultados de testes ou `.env`.

Para conferir o ambiente do Netlify antes de publicar, use `npx netlify-cli dev --offline --dir dist --functions netlify/functions`. Para publicar, prefira importar um repositório Git no painel do Netlify; o recurso de arrastar somente a pasta `dist` publica a interface sem a Function e, portanto, sem login, progresso ou IA.

### Dependências externas para uso institucional

- Identificação do revisor, data e alvos semânticos por estrutura nas lâminas destinadas a exercícios de clique.
- Fonoaudiólogos/docentes responsáveis pela aprovação e versionamento de cada atividade.
- Credenciais e domínio de envio para recuperação e verificação de e-mail.
- Textos jurídicos definidos pelo responsável pelo tratamento dos dados.
- Hospedagem, banco gerenciado, backups, logs e alertas do ambiente escolhido.

Esses itens dependem da infraestrutura e da governança adotadas na publicação. Questões de IA permanecem identificadas como conteúdo sem revisão acadêmica.
