# FonoLingo

## Recuperação de senha

No login, selecione **Esqueci minha senha**, informe o e-mail cadastrado e abra o link recebido para escolher uma nova senha. O link expira em 30 minutos, só funciona uma vez e encerra as sessões antigas. O progresso da conta é preservado.

Configure no servidor local (`.env`) ou nas variáveis de ambiente do Netlify:

- `APP_ORIGIN`: endereço público do aplicativo, por exemplo `https://fonolingo.netlify.app` (local: `http://localhost:5188`).
- `RESEND_API_KEY`: chave do Resend, somente no servidor.
- `RECOVERY_EMAIL_FROM`: remetente autorizado de um domínio verificado no Resend.

O envio usa a [API oficial do Resend](https://resend.com/docs/api-reference/emails/send-email). No Netlify, publique novamente após configurar as variáveis. Sem configuração, a tela informa que o envio está indisponível. Falhas do provedor são registradas como `password_recovery_delivery_failed`, sem expor tokens ou revelar se o e-mail existe. Solicitações para a mesma conta têm intervalo mínimo de um minuto.

Execute `npm run build` para validar a aplicação e `node --test tests/*.test.mjs` (Node 22.15+ ou 24+) para testar a recuperação em um banco temporário, a função Netlify com armazenamento simulado e o envio com provedor simulado.

## Contas independentes

O cadastro aceita vários e-mails, com progresso, sessões e limite diário de IA por conta. No Netlify, a conta anterior permanece em `primary-user`, preservando seu ID, progresso e acessos existentes. Novas contas ficam em `users/<hash do e-mail normalizado>`; índices de sessão e recuperação apontam para a conta correspondente. E-mails repetidos são recusados atomicamente.

## Revisão espaçada

Erros e respostas parciais em sessões concluídas agendam o conceito para 1 dia depois. Acertos a partir do vencimento ampliam o intervalo para 3, 7, 14 e 30 dias; novos erros reiniciam em 1 dia. Cada sessão conta uma tentativa por conceito, considerando a menor nota; acertos antecipados mantêm a data. O agendamento usa o histórico salvo da conta, inclusive sessões anteriores.

A revisão oferece 5 perguntas novas sobre o mesmo conceito, geradas por IA, com exclusão de até 60 enunciados anteriores. O servidor valida os conceitos e rejeita enunciados repetidos após normalização; equivalência semântica depende da geração. A opção de praticar até 5 questões anteriores permanece disponível, inclusive quando a geração falha. Respostas abertas usam a avaliação existente ou autoavaliação.

Os indicadores mostram conceitos recuperados após dois acertos em sessões a partir do vencimento desde a última dificuldade. Erros recorrentes são dificuldades em pelo menos duas sessões no histórico, sem recuperação atual. Uma nova dificuldade remove o estado recuperado. Todos os indicadores usam o histórico salvo, incluindo autoavaliações.

## Prazo da IA no Netlify

As chamadas de IA têm um orçamento total de 23 segundos, abaixo do limite de execução de 30 segundos observado na instalação. Gemini 3 usa thinking LOW. Em timeout ou erro temporário do provedor, a chamada usa o prazo restante com `GEMINI_FALLBACK_MODEL` (padrão `gemini-3.1-flash-lite`). Erros de autenticação e cota não acionam contingência. Se ambos demorarem, a API retorna JSON com mensagem de prazo excedido, preservando o progresso.
