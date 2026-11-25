# API de parcelas

Todas as rotas exigem `Authorization: Bearer <token>`. Clientes consultam e pagam
somente as próprias parcelas. O administrador e o funcionário com as duas roles
`funcionario` e `financeiro` têm acesso a todas as parcelas disponíveis.
Apólices em análise ou recusadas ficam fora da consulta e do pagamento.

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/parcelas/get_all` | Listar parcelas, incluindo pagas e canceladas. |
| GET | `/parcelas/get_all?idApolice=1` | Filtrar por apólice. |
| GET | `/parcelas/get/1` | Consultar uma parcela. |
| POST | `/parcelas/pagar/1` | Obter o link de pagamento do Stripe. |
| POST | `/parcelas/atualizar_pagamento/1` | Consultar o Stripe e atualizar o status local. |

O roteamento segue o padrão existente: sem reescrita de URL, use
`index.php?url=parcelas/get_all&idApolice=1`, por exemplo.

As rotas POST não precisam de corpo. O valor e a fatura vêm do banco.
`pagar` retorna `message`, `linkPagamento` e `parcela`; o frontend deve abrir
`linkPagamento` para concluir o pagamento na página do Stripe. Se a emissão
anterior falhou, a rota tenta emitir somente a parcela solicitada.

Depois da aprovação do risco, uma parcela `PENDENTE` ou `ABERTA` com vencimento anterior à data de hoje em São Paulo torna a apólice `INADIMPLENTE`.
O dia do vencimento ainda conta como em dia. Parcelas pagas e canceladas ficam fora do cálculo.
A baixa e a atualização da apólice ocorrem na mesma transação. Enquanto houver atraso, a apólice continua `INADIMPLENTE`.
Ao regularizar a última vencida, ela volta a `ATIVA` se a primeira parcela estiver paga, ou a `APROVADA` se ainda aguardar o primeiro pagamento.
O webhook e a sincronização manual aplicam a mesma regra. As consultas de apólices e parcelas também atualizam o status gravado antes de responder.

Para receber a confirmação automática, configure no painel do Stripe um destino para o evento
`invoice.paid` na URL pública da API, `/index.php?url=stripe/webhook`.
No arquivo `.env` da API, defina `STRIPE_WEBHOOK_SECRET` com o segredo de assinatura desse destino (`whsec_...`).

### Atualização diária no cPanel

Em **Trabalhos Cron**, agende [atualizar-inadimplencia.php](../scripts/atualizar-inadimplencia.php) uma vez por dia, logo após a meia-noite de São Paulo. Use o horário equivalente do servidor.
O comando abaixo usa um caminho de exemplo. Ajuste o executável PHP e a pasta da API conforme a hospedagem.

```sh
php /home/USUARIO/api.insurance.dev.br/scripts/atualizar-inadimplencia.php
```

A tarefa atualiza também os registros anteriores à publicação, mesmo nos dias em que ninguém acessa o sistema. Usa o mesmo banco configurado no `.env` da API.

Os valores são retornados em `valorCentavos`. IDs inválidos retornam 400;
parcelas inexistentes ou de outro cliente, 404; parcelas já pagas, canceladas
ou de apólices canceladas/encerradas não podem ser pagas e retornam 409.
Falhas na comunicação com o Stripe retornam 502.

## Verificação

Na raiz do projeto, execute `php Back_end/tests/AtivacaoApoliceTest.php`.
O teste usa a conexão MySQL do `.env`, cria tabelas temporárias na própria
sessão e simula o Stripe. Não altera os registros reais nem faz cobranças.
