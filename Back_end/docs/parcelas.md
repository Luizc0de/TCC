# API de parcelas

Todas as rotas exigem `Authorization: Bearer <token>`. Clientes consultam e pagam
somente as próprias parcelas. As roles `admin` e `funcionario` têm acesso a todas.

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

Abrir o link não marca a parcela como paga. Com o [webhook configurado](stripe-webhook.md),
o Stripe avisa o backend e a parcela passa automaticamente para `PAGA` no banco.
Recarregue a listagem para exibir a alteração. A rota `atualizar_pagamento`
continua disponível para uma consulta manual; a listagem lê o banco e não
faz chamadas ao Stripe.

Os valores são retornados em `valorCentavos`. IDs inválidos retornam 400;
parcelas inexistentes ou de outro cliente, 404; parcelas já pagas, canceladas
ou de apólices canceladas/encerradas não podem ser pagas e retornam 409.
Falhas na comunicação com o Stripe retornam 502.

## Verificação

Na raiz do projeto, execute `php Back_end/tests/ParcelaControllerTest.php`.
O teste usa a conexão MySQL do `.env`, cria tabelas temporárias na própria
sessão e simula o Stripe. Não altera os registros reais nem faz cobranças.
