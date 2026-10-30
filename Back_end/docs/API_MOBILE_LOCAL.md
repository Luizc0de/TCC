# API do TCC — integração mobile para testes locais no XAMPP

Este documento descreve o backend PHP existente e serve como entrada para uma
IA implementar um aplicativo mobile que o consuma em **ambiente local de teste**.
O backend está no XAMPP, na pasta `C:\xampp\htdocs\TCC\Back_end`, e ainda não
deve ser configurado com domínio público. Usuários, IDs e faturas dos exemplos
são fictícios; as URLs da API usam o servidor local.

**Instrução para a IA:** configurar o ambiente como desenvolvimento local.
A URL base de referência é `http://localhost/TCC/Back_end/index.php`.
Para o aplicativo executado em um telefone ou em outro ambiente, ajustar apenas
o host para um endereço local do computador que esse ambiente consiga acessar,
conforme a seção 2.1. Não substituir as URLs por um domínio na internet.

Contrato conferido no código em **30/10/2026**. Os trechos JSON são exemplos de
formato, não dados de produção nem garantia de que os IDs existam no banco.
As pendências da seção 12 fazem parte deste contrato: não presumir que uma
rota funciona apenas porque foi cadastrada no roteador.

## 1. Objetivo do aplicativo

O fluxo principal para o cliente é:

1. Cadastrar uma conta de pessoa física, se ainda não tiver conta.
2. Fazer login com e-mail e senha.
3. Consultar o próprio perfil.
4. Listar suas parcelas e consultar os detalhes de uma parcela.
5. Abrir o link de pagamento hospedado no Stripe.
6. Ao voltar ao aplicativo, consultar a confirmação e atualizar a listagem.
7. Sair removendo o token salvo no dispositivo.

Não é necessário integrar um SDK de pagamento no app para esse fluxo. A API
retorna `linkPagamento`; os dados do cartão são preenchidos na página do Stripe.
Os pagamentos do TCC são simulados. A API roda localmente; a página de pagamento
do Stripe continua sendo externa e exige internet. Não trocar `linkPagamento`
por localhost: abrir a URL exata que a API retornar.

As rotas administrativas também estão documentadas, mas não devem aparecer
como funções do aplicativo de um cliente comum.

## 2. URL local e construção das requisições

### 2.1 Configuração para teste local

Defina uma única configuração de ambiente no aplicativo:

```text
API_ENDPOINT=http://localhost/TCC/Back_end/index.php
```

Essa URL serve para chamadas realizadas **no próprio computador do XAMPP**,
por exemplo no navegador, Postman ou em uma versão web do aplicativo nesse
computador. Inicie Apache e MySQL no XAMPP antes dos testes.

Se o Apache estiver em outra porta, inclua-a na configuração. Exemplo para 8080:

```text
API_ENDPOINT=http://localhost:8080/TCC/Back_end/index.php
```

O roteador atual recebe a rota pelo parâmetro de consulta **`url`**. O formato
mais independente da configuração do servidor é:

```text
POST http://localhost/TCC/Back_end/index.php?url=auth/login
GET  http://localhost/TCC/Back_end/index.php?url=profile
GET  http://localhost/TCC/Back_end/index.php?url=parcelas/get_all&idApolice=7
POST http://localhost/TCC/Back_end/index.php?url=parcelas/pagar/15
```

Neste documento, `/profile`, por exemplo, significa o valor lógico da rota.
Na requisição real, use `API_ENDPOINT?url=profile`. O valor de `url` não precisa
da barra inicial. Parâmetros extras, como `idApolice`, ficam na mesma query,
depois de `&`; não acrescente um segundo `?`.

URLs reescritas, como `http://localhost/TCC/Back_end/profile`, são uma opção
se o Apache estiver configurado. O `.htaccess` atual usa
`RewriteBase /TCC/Back_end/`. Para estes testes, prefira o formato explícito
com `index.php?url=...` em todas as chamadas.

#### Atenção ao local onde o aplicativo executa

Em um **telefone físico**, `localhost` aponta para o próprio telefone, e não
para o computador com XAMPP. Nesse caso, configure `API_ENDPOINT` com o IPv4
do computador na rede local:

```text
API_ENDPOINT=http://IP_DO_COMPUTADOR/TCC/Back_end/index.php
```

`IP_DO_COMPUTADOR` é uma indicação a substituir pelo endereço real, não um host
para copiar literalmente. Obtenha o IPv4 do adaptador Wi-Fi/Ethernet ativo com
`ipconfig` no computador. Se a porta do Apache for diferente de 80, inclua-a.
Mantenha telefone e computador na mesma rede e permita que o Apache receba
essas conexões locais. Teste a URL no navegador do telefone antes de configurar o app.

Em um **emulador**, use um endereço local do computador que o emulador consiga
alcançar; não presumir que `localhost` represente a máquina hospedeira. O IPv4
da rede local pode ser usado quando houver conectividade entre esses ambientes.

Se a plataforma mobile bloquear HTTP sem TLS, permita HTTP somente na
configuração de desenvolvimento usada neste teste. Não alterar a API para HTTPS
sem que o servidor local tenha HTTPS configurado.

Mantenha a URL em **um único lugar**, de forma configurável. Todos os exemplos
abaixo usam localhost como referência do servidor; em execução no telefone,
troque o host de todas as requisições pela configuração local escolhida.

### 2.2 Headers e corpo

Envie JSON em UTF-8 nos POST que têm corpo:

```http
Accept: application/json
Content-Type: application/json
```

Em toda rota privada, acrescente:

```http
Authorization: Bearer TOKEN_RETORNADO_NO_LOGIN
```

GET não tem corpo. Nos POST de pagamento e sincronização, não é necessário
enviar corpo. Não envie `idCliente`, valor ou status para dar baixa na parcela.

O backend não tem prefixo `/api`, versão `/v1`, paginação ou envelope JSON
padronizado. Não invente esses elementos no cliente HTTP.

## 3. Autenticação e sessão

### POST `/auth/login`

Pública. O mesmo endpoint autentica clientes e funcionários.

Requisição:

```json
{
  "email": "cliente@example.com",
  "password": "senha-do-usuario"
}
```

Resposta **200**:

```json
{
  "message": "Login successful.",
  "token": "JWT_RETORNADO_PELO_SERVIDOR"
}
```

Credenciais incorretas retornam **400**, não 401:

```json
{
  "message": "Invalid email or password."
}
```

Um campo ausente também retorna **400**, por exemplo:

```json
{
  "error": "The field (email) is required."
}
```

O token JWT dura **3.600 segundos**, contados a partir da emissão. Seu payload
contém `sub` (ID do usuário autenticado), `email`, `roles`, `iat` e `exp`.
Não há refresh token, renovação de sessão nem endpoint de logout.

Regras para o aplicativo:

- Salvar o token no armazenamento seguro da plataforma, não em logs ou URLs.
- Anexar o token pelo header `Authorization` nas requisições privadas.
- Em **401**, apagar a sessão local e pedir novo login.
- Implementar logout apagando o token local.
- Se decodificar o JWT para ler `exp` ou adaptar a interface por `roles`,
  não usar isso como substituto da autorização feita no servidor.
- Não embarcar segredo de assinatura JWT, credenciais MySQL, SMTP ou chaves
  secretas do Stripe no aplicativo. O app só precisa da URL local acessível e do token.

Exemplo de resposta privada sem token:

```json
{
  "error": "Token não informado"
}
```

Outras mensagens de **401** são `Formato do token inválido` e
`Token inválido ou expirado`.

## 4. Cadastro e perfil

### POST `/users_PF` — cadastrar cliente pessoa física

Pública. Todos os quatro campos são obrigatórios e devem ser strings:

```json
{
  "name": "Maria Exemplo",
  "email": "maria@example.com",
  "password": "senha-escolhida-pelo-usuario",
  "cpf": "12345678900"
}
```

Resposta **201** quando o cadastro e o envio do e-mail terminam com sucesso:

```json
{
  "success": true,
  "message": "Email enviado com sucesso."
}
```

O cadastro **não retorna token, ID do cliente ou perfil**. Depois, use o login.
E-mail ou CPF duplicado retorna **400** com `error: "Email ou CPF já cadastrado."`.

O registro é criado antes da tentativa de envio do e-mail. Se o envio falhar,
a resposta ainda pode ser **201**, com este formato:

```json
{
  "success": false,
  "message": "Não foi possível enviar o e-mail.",
  "error": "Detalhe variável do erro de envio"
}
```

Nesse caso, não repetir automaticamente o cadastro: a conta pode já existir.
O serviço de e-mail atual usa um sandbox SMTP. Não prometer ao usuário que um
código necessariamente chegará à sua caixa de entrada. A rota de verificação
de código está indisponível conforme a seção 12; não bloquear o app nessa tela.
O login atual não exige que o campo de verificação de e-mail esteja ativo.

### GET `/profile` — perfil do cliente autenticado

Privada. Sem parâmetros. Resposta **200**:

```json
{
  "nome": "Maria Exemplo",
  "email": "maria@example.com",
  "cpf": "12345678900"
}
```

Observe a diferença: o cadastro recebe **`name`**, mas o perfil retorna **`nome`**.
O perfil não retorna `id` nem `roles`. Usuário não encontrado retorna **404**
com `error: "User not found"`.

Esse endpoint procura na tabela de clientes. Não é um perfil de funcionário:
um token de funcionário não garante um perfil correto aqui, mesmo que seja válido.

### POST `/profile/change_password` — trocar senha

Privada. Corpo:

```json
{
  "current_password": "senha-atual",
  "new_password": "nova-senha"
}
```

Resposta prevista pelo serviço, **200**:

```json
{
  "message": "Password changed successfully"
}
```

Senha atual incorreta retorna **400**, com
`error: "Current password is incorrect"`. Usuário ausente retorna **404**.

**Pendência atual:** a atualização SQL usa a coluna `id`, mas a tabela de
clientes usa `idCliente`. A troca pode falhar com 500 no esquema atual. Deixar
essa função desativada até corrigir e validar o backend; não simular sucesso.

## 5. Parcelas — principal recurso do aplicativo cliente

Todas as rotas desta seção exigem JWT.

O servidor aplica o vínculo com o usuário autenticado:

- Roles `admin` ou `funcionario`: podem consultar todas as parcelas.
- Demais usuários autenticados: apenas parcelas de seu próprio `idCliente`.
- Acesso direto à parcela de outro cliente retorna **404**.

Não é necessário enviar `idCliente`; o backend obtém o escopo do token.

### 5.1 Modelo de parcela

Exemplo de objeto retornado:

```json
{
  "idParcela": 15,
  "idApolice": 7,
  "numeroParcela": 1,
  "valorCentavos": 15000,
  "dataVencimento": "2027-01-10",
  "status": "ABERTA",
  "stripeInvoiceId": "in_EXEMPLO",
  "linkPagamento": "https://invoice.stripe.com/URL_ILUSTRATIVA",
  "numeroApolice": "AP-EXEMPLO123",
  "idCliente": 3,
  "statusApolice": "ATIVA"
}
```

| Campo | Como consumir |
| --- | --- |
| `idParcela` | ID usado nas rotas de consulta, pagamento e sincronização. |
| `idApolice` | ID numérico usado no filtro da listagem de parcelas. |
| `numeroParcela` | Posição da parcela, por exemplo 1, 2, 3. |
| `valorCentavos` | Inteiro monetário em centavos; 15000 representa R$ 150,00. |
| `dataVencimento` | Data `YYYY-MM-DD`, sem horário. |
| `status` | `PENDENTE`, `ABERTA`, `PAGA` ou `CANCELADA`. |
| `stripeInvoiceId` | Referência interna da fatura; pode ser `null`. |
| `linkPagamento` | URL de pagamento do Stripe; pode ser `null`. |
| `numeroApolice` | Número textual `AP-...`, diferente de `idApolice`. |
| `idCliente` | Dono da apólice. |
| `statusApolice` | Situação da apólice, separada da situação da parcela. |

O backend retorna dados do PDO sem normalização central. IDs e valores inteiros
podem chegar como número JSON ou string numérica dependendo do ambiente PHP/PDO.
Aceite ambos e normalize no cliente. Preserve CPF, placa, chassi e códigos como
strings. Valores decimais de outros recursos, como `valor`, normalmente são strings.

Não converter `YYYY-MM-DD` para um instante UTC para exibição: isso pode deslocar
o dia conforme o fuso. Trate como data de calendário.

| Status da parcela | Apresentação sugerida |
| --- | --- |
| `PENDENTE` | Cobrança ainda não emitida/concluída no Stripe; o botão pagar pode tentar a emissão. |
| `ABERTA` | Aguardando quitação. |
| `PAGA` | Pagamento confirmado; desabilitar pagar. |
| `CANCELADA` | Parcela cancelada; desabilitar pagar. |

Não existe status `ATRASADA` na tabela de parcelas atual. Se quiser indicar
atraso, derive uma informação visual comparando vencimento e data atual,
sem alterar o status recebido nem enviar um novo status ao servidor.

### 5.2 GET `/parcelas/get_all` — listar parcelas

Sem filtro, retorna todas as parcelas permitidas para o usuário, inclusive
pagas e canceladas. Query opcional:

| Parâmetro | Tipo | Efeito |
| --- | --- | --- |
| `idApolice` | Inteiro maior que zero | Filtra as parcelas de uma apólice dentro do escopo permitido. |

URL completa de exemplo:

```text
http://localhost/TCC/Back_end/index.php?url=parcelas/get_all&idApolice=7
```

Resposta **200**: **array direto de objetos Parcela**, sem `data`, `items` ou `total`.
Sem resultados, retorna `[]`. Um filtro de apólice de outro cliente retorna `[]`.
A ordem é vencimento, ID da apólice e número da parcela.

Não existem filtros de status, busca ou paginação no servidor. Filtros visuais
do app devem operar sobre o array recebido. O filtro `idApolice=abc` retorna **400**.

### 5.3 GET `/parcelas/get/{id}` — consultar parcela

`{id}` é o **ID numérico da parcela**, inteiro maior que zero.
Resposta **200**: um objeto Parcela, sem envelope.

Exemplo de erro **404**:

```json
{
  "error": "Parcela não encontrada."
}
```

ID inválido retorna **400**:

```json
{
  "error": "Informe um identificador inteiro maior que zero."
}
```

### 5.4 POST `/parcelas/pagar/{id}` — iniciar pagamento

Sem corpo. O valor e a referência da cobrança vêm do banco.
Resposta **200**:

```json
{
  "message": "Acesse o link para pagar a parcela.",
  "linkPagamento": "https://invoice.stripe.com/URL_ILUSTRATIVA",
  "parcela": {
    "idParcela": 15,
    "idApolice": 7,
    "numeroParcela": 1,
    "valorCentavos": 15000,
    "dataVencimento": "2027-01-10",
    "status": "ABERTA",
    "stripeInvoiceId": "in_EXEMPLO",
    "linkPagamento": "https://invoice.stripe.com/URL_ILUSTRATIVA",
    "numeroApolice": "AP-EXEMPLO123",
    "idCliente": 3,
    "statusApolice": "ATIVA"
  }
}
```

Use exatamente a URL `linkPagamento` retornada pelo servidor, abrindo-a no
navegador do dispositivo ou na superfície de navegação segura da plataforma.
Não monte a URL a partir de `stripeInvoiceId` e não implemente coleta de cartão
em um formulário próprio do aplicativo.

Esse POST **não debita dinheiro sozinho** e **não significa pagamento concluído**.
Ele retorna o link e pode retomar a emissão de uma cobrança pendente. Ao retornar
do navegador, o aplicativo deve consultar a confirmação.

Conflitos **409** incluem:

```json
{
  "error": "Esta parcela já está paga."
}
```

```json
{
  "error": "Não é possível pagar uma parcela ou apólice cancelada ou encerrada."
}
```

Ao receber “já paga”, recarregue a parcela: ela pode ter sido quitada em outra
sessão. Não gere outra cobrança.

Falha de emissão, comunicação com Stripe ou link indisponível pode retornar
**502**. Apresente uma opção de tentar novamente, mantendo os dados da parcela.

### 5.5 POST `/parcelas/atualizar_pagamento/{id}` — consultar confirmação

Sem corpo. Consulta a fatura no Stripe e sincroniza o status local.
Resposta **200**: um objeto Parcela, sem envelope. Pode continuar `ABERTA` se
o pagamento ainda não tiver sido confirmado; HTTP 200 sozinho não significa quitação.

Se ainda não houver fatura, retorna **409**:

```json
{
  "error": "A parcela ainda não possui uma cobrança no Stripe."
}
```

Uma cobrança ainda indisponível para pagamento também pode retornar **409**.
Parcelas já `PAGA` ou `CANCELADA` são retornadas sem consultar novamente o Stripe.

### 5.6 Fluxo mobile de pagamento

1. Carregar a parcela e mostrar valor, vencimento e situação.
2. Desabilitar pagar se `status` for `PAGA` ou `CANCELADA`, ou se
   `statusApolice` for `CANCELADA` ou `ENCERRADA`.
3. Ao tocar em pagar, bloquear cliques simultâneos e fazer o POST de pagamento.
4. Abrir `linkPagamento` e manter o ID da parcela em memória/estado do fluxo.
5. Quando o app retomar o foco, fazer uma sincronização e atualizar a tela.
6. Só mostrar “pago” quando o objeto da API tiver `status: "PAGA"`.
7. Se continuar `ABERTA`, mostrar “aguardando confirmação” e oferecer atualizar.

Se implementar consultas periódicas, faça poucas tentativas enquanto a tela
estiver visível, por exemplo a cada 5 segundos durante até 1 minuto, cancelando
ao sair da tela. Isso é uma política sugerida do aplicativo, não uma exigência
ou limite implementado pelo backend. Não consultar em loop sem limite.

**Estado do webhook nesta cópia:** há uma rota `/stripe/webhook` cadastrada,
mas os arquivos de controller/service correspondentes não foram encontrados
na conferência. Por isso, o aplicativo gerado deve funcionar com a sincronização
explícita acima até o recebimento automático ser restaurado e validado no servidor.
Quando o webhook estiver operacional, ele atualizará o banco; o app ainda
precisará buscar a parcela novamente para exibir o novo estado.

Não há deep link, URL de retorno mobile, WebSocket, push ou endpoint de
notificações implementado. Não presumir retorno automático do Stripe para o app.

## 6. Consultas de apólices e clientes

A listagem `/apolices/get_all` filtra as apólices pelo usuário autenticado.
A consulta individual por número e a listagem de clientes ainda não aplicam
esse filtro; não presumir que tenham a mesma autorização da listagem de apólices.

### GET `/apolices/get_all`

Privada. Retorna um array, sem paginação, com as apólices vinculadas ao usuário:

- Cliente, role `user`: filtra `idCliente` pelo `sub` do JWT.
- Funcionário, role `funcionario`: filtra `idFuncionario` pelo `sub` do JWT.
- A role `admin` também usa o vínculo de funcionário; não libera uma lista global.
- Perfil sem uma dessas roles retorna 403; sem vínculos, retorna `[]` com 200.

O app envia somente o token. Parâmetros `idCliente`, `idFuncionario` ou `roles`
na URL não alteram o escopo. IDs iguais nas tabelas de cliente e funcionário
não misturam resultados: o filtro usa apenas a coluna correspondente à role.
Se o token contiver role de funcionário/admin junto de `user`, prevalece
o vínculo de funcionário.

Exemplo de resposta:

```json
[
  {
    "id": 7,
    "cliente": "Maria Exemplo",
    "tipo": "VEICULO",
    "valor": "1800.00",
    "status": "ATIVA",
    "data": "2026-11-01"
  }
]
```

`cliente`, `valor` e `data` podem ser `null` conforme os registros.
Esta resposta **não inclui `numeroApolice`**. Não tente usar `id` no endpoint
de detalhes abaixo: ele procura pelo número textual da apólice.

Para agrupar as parcelas do próprio cliente em cartões de apólice, é possível
agrupar o array de `/parcelas/get_all` por `idApolice` e usar seu `numeroApolice`.
Essa organização local não cria um endpoint de “minhas apólices” e não fornece
campos que não estejam presentes nas parcelas.

### GET `/apolices/get/{numeroApolice}`

Privada. Apesar de a rota no PHP chamar o placeholder de `{id}`, o valor é o
**número textual da apólice**, por exemplo `AP-EXEMPLO123`.

```text
http://localhost/TCC/Back_end/index.php?url=apolices/get/AP-EXEMPLO123
```

Resposta **200**:

```json
{
  "id": 7,
  "numeroApolice": "AP-EXEMPLO123",
  "cliente": "Maria Exemplo",
  "tipo": "VEICULO",
  "valor": "1800.00",
  "status": "ATIVA",
  "data": "2026-11-01",
  "bem": {
    "id": 4,
    "tipo": "VEICULO",
    "finalidade": "PESSOAL",
    "descricao": "Veículo de uso pessoal",
    "valorAvaliacao": "60000.00",
    "marca": "Marca Exemplo",
    "placa": "ABC1D23",
    "chassi": "CHASSI-EXEMPLO",
    "modeloVeiculo": "Modelo Exemplo",
    "dataFabricacao": "2024-01-01"
  }
}
```

`bem` pode ser `null`. Os campos específicos variam com seu tipo:

| Tipo de bem | Campos específicos retornados |
| --- | --- |
| `VEICULO` | `placa`, `chassi`, `modeloVeiculo`, `dataFabricacao` |
| `TELEFONE` | `modelo`, `numeroSerie`, `imei` |
| `NOTEBOOK` | `modelo`, `numeroSerie` |

Os campos comuns são `id`, `tipo`, `finalidade`, `descricao`, `valorAvaliacao`
e `marca`. Vários podem ser `null`. O objeto não retorna a lista de parcelas;
para isso, use o `id` numérico em `/parcelas/get_all&idApolice=...`.

Ausência da apólice retorna **404**, com `error: "Apólice não encontrada."`.

### GET `/getclientes`

Privada. Retorna a lista global de clientes:

```json
[
  {
    "id": 3,
    "name": "Maria Exemplo",
    "email": "maria@example.com"
  }
]
```

Não há filtros nem paginação. No servidor atual, basta um JWT válido; não há
checagem de role nesta rota. Não incluir a lista de todos os clientes no app cliente.

## 7. Criar apólice — referência para aplicativo de funcionário

### POST `/apolice`

Privada. O controller usa o `sub` do token como `idFuncionario`; por isso,
o uso coerente deste endpoint é com uma conta de funcionário existente.
Embora a rota esteja marcada apenas com autenticação, o aplicativo de cliente
não deve implementar essa chamada como contratação direta sem ajustar o backend.

Exemplo de corpo para um veículo:

```json
{
  "status": "SOLICITADA",
  "tipoApolice": "VEICULO",
  "idCliente": 3,
  "valorTotal": "1800.00",
  "quantidadeParcelas": 12,
  "diaVencimento": 10,
  "dataEmissao": "2026-11-01",
  "dataVencimento": "2027-11-01",
  "FirstParcelNow": false,
  "daysfromfirstparcel": 9,
  "bem": {
    "tipo": "VEICULO",
    "finalidade": "PESSOAL",
    "descricao": "Veículo de uso pessoal",
    "valorAvaliacao": "60000.00",
    "marca": "Marca Exemplo",
    "placa": "ABC1D23",
    "chassi": "CHASSI-EXEMPLO",
    "modeloVeiculo": "Modelo Exemplo",
    "dataFabricacao": "2024-01-01"
  }
}
```

| Campo | Obrigatoriedade e significado |
| --- | --- |
| `status` | Obrigatório; status da apólice no enum abaixo. |
| `tipoApolice` | Obrigatório; tipo da apólice no enum abaixo. |
| `idCliente` | Obrigatório; cliente existente. |
| `valorTotal` | Obrigatório; valor em reais, preferencialmente string decimal com ponto. |
| `quantidadeParcelas` | Obrigatório; enviar inteiro positivo. |
| `diaVencimento` | Obrigatório; inteiro entre **1 e 21**. |
| `dataEmissao` | Opcional; data `YYYY-MM-DD`, salva como `dataAssinatura`. |
| `dataVencimento` | Opcional; data final da apólice. |
| `FirstParcelNow` | Opcional; boolean, padrão `false`; manter exatamente esta capitalização. |
| `daysfromfirstparcel` | Obrigatório se `FirstParcelNow=false`; enviar prazo inteiro positivo. |
| `bem` | Objeto obrigatório com os campos abaixo. |

`FirstParcelNow=true` define a primeira data de vencimento a partir da emissão;
isso não debita a primeira parcela automaticamente. As demais parcelas usam
o dia de vencimento nos meses seguintes. Se `dataEmissao` for omitida, o cálculo
usa o dia atual do servidor. A diferença de arredondamento vai para a última parcela.
Datas que já passaram podem impedir a emissão da cobrança no Stripe.

Campos de `bem`:

| Campo | Regra |
| --- | --- |
| `tipo` | Obrigatório: `VEICULO`, `TELEFONE` ou `NOTEBOOK`. |
| `finalidade` | String obrigatória. |
| `descricao` | String obrigatória. |
| `placa`, `chassi`, `marca`, `modeloVeiculo` | Obrigatórios para `VEICULO`. |
| `numeroSerie`, `modelo`, `imei` | Obrigatórios para `TELEFONE`. |
| `numeroSerie`, `modelo` | Obrigatórios para `NOTEBOOK`. |
| `valorAvaliacao` | Opcional; valor decimal em reais. |
| `marca` | Opcional para telefone/notebook. |
| `dataFabricacao` | Opcional; data para veículo. |

Tipos de apólice no banco: `VEICULO`, `IMOVEL`, `VIDA`, `MAQUINARIO`, `ELETRONICO`.
Os únicos tipos de **bem** implementados são os três da tabela acima. Não
presumir que exista um cadastro completo de bens de imóvel, vida ou maquinário.

Status de apólice no banco: `SOLICITADA`, `EM_ANALISE`, `AGUARDANDO_DADOS`,
`APROVADA`, `RECUSADA`, `ATIVA`, `INADIMPLENTE`, `SUSPENSA`, `CANCELADA`, `ENCERRADA`.
Não há rotas para editar esse status no contrato atual.

Resposta **201**:

```json
{
  "message": "Apolice criada com sucesso."
}
```

Se a apólice foi salva, mas houve falha ao emitir cobranças no Stripe,
a resposta ainda é **201**, acrescentando:

```json
{
  "message": "Apolice criada com sucesso.",
  "avisoStripe": "Algumas parcelas não foram geradas no Stripe e permanecem PENDENTES.",
  "falhasStripe": [
    "Detalhe variável da falha de emissão"
  ]
}
```

Não repetir a criação inteira nesse caso: ela já foi persistida e isso pode
duplicar apólices. O POST de pagamento pode tentar reemitir uma parcela pendente.
A resposta de criação não retorna `idApolice`, `numeroApolice` ou as parcelas;
não inventar esses campos na tela ou nos modelos do aplicativo.

## 8. Criar funcionário — referência administrativa

### POST `/funcionario`

Privada. Corpo com todos os campos obrigatórios:

```json
{
  "name": "Funcionário Exemplo",
  "email": "funcionario@example.com",
  "password": "senha-do-funcionario",
  "setor": "ATENDIMENTO",
  "cpf": "12345678900",
  "salario": "2500.00"
}
```

No sucesso, o serviço atual não emite JSON nem define 201: a resposta tende a
ser **200 com corpo vazio**. Um consumidor desta rota deve aceitar corpo vazio.
Duplicidade de e-mail/CPF pode retornar **400** e falha interna, **500**.

A rota não verifica role administrativa no servidor atual, apenas JWT. O login
de funcionário atribui `roles: ["funcionario"]`. Não presumir que cadastrar um
funcionário permita ao app escolher uma role ou produzir automaticamente um token `admin`.
Não expor esta função no aplicativo de clientes.

## 9. Erros e cliente HTTP

As respostas não têm um envelope único. As formas mais comuns são:

```json
{"error": "Descrição do erro"}
```

```json
{"message": "Invalid email or password."}
```

O roteador também pode retornar:

```json
{
  "error": true,
  "success": false,
  "message": "Sorry, route not found."
}
```

| HTTP | Comportamento esperado no aplicativo |
| --- | --- |
| 200 | Ler o formato específico da rota; não presumir pagamento realizado. |
| 201 | Registro criado; verificar avisos de e-mail/Stripe antes de repetir operações. |
| 400 | Campos/IDs inválidos ou credenciais incorretas no login; mostrar erro adequado. |
| 401 | Sessão ausente, inválida ou expirada; solicitar login. |
| 403 | Falta de permissão, quando o servidor exigir uma role específica. |
| 404 | Rota/recurso inexistente ou parcela fora do escopo do usuário. |
| 405 | Método HTTP incorreto. |
| 409 | Conflito de pagamento; atualizar a parcela e apresentar a situação. |
| 500 | Falha interna; mostrar mensagem geral e permitir nova tentativa apropriada. |
| 502 | Falha de integração/cobrança Stripe nas rotas de parcelas. |

Escolha a mensagem usando primeiro `error` se ele for string, depois `message`,
e por fim uma mensagem geral. Não apresente `error: true` como texto ao usuário.
Falhas PHP/servidor podem retornar corpo vazio ou conteúdo não JSON; tratar
isso sem derrubar o app. Não mostrar detalhes SQL, stack traces ou HTML ao usuário.

Não repetir automaticamente POST de cadastro, criação de apólice ou funcionário
após timeout: o registro pode ter sido salvo antes da interrupção da resposta.
Para GET, permitir repetir após falha de rede. Para pagamento, evitar cliques
concorrentes e consultar o estado antes de oferecer uma nova tentativa.

## 10. Exemplo de cliente HTTP em JavaScript

Exemplo de referência de construção de URL, header e leitura da resposta.
Adapte o transporte e o armazenamento seguro à tecnologia escolhida para o app;
a função não implementa persistência de token, navegação, timeout ou tentativas.

```javascript
const API_ENDPOINT = "http://localhost/TCC/Back_end/index.php";

async function apiRequest(route, { method = "GET", token, body, query = {} } = {}) {
  const url = new URL(API_ENDPOINT);
  url.searchParams.set("url", route.replace(/^\/+/, ""));
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url.toString(), {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data = null;
  if (text.trim() !== "") {
    try {
      data = JSON.parse(text);
    } catch {
      const error = new Error("O servidor retornou uma resposta inválida.");
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : data?.message;
    const error = new Error(message || "Não foi possível concluir a requisição.");
    error.status = response.status;
    throw error;
  }
  return data;
}

// 1. Login — obtenha os valores do formulário; não fixe credenciais no app.
const login = await apiRequest("auth/login", {
  method: "POST",
  body: { email: emailDigitado, password: senhaDigitada },
});
const token = login.token;

// 2. Perfil e parcelas do usuário autenticado.
const perfil = await apiRequest("profile", { token });
const parcelas = await apiRequest("parcelas/get_all", { token });

// 3. Filtrar uma apólice, com ID obtido das parcelas.
const parcelasDaApolice = await apiRequest("parcelas/get_all", {
  token,
  query: { idApolice: idApoliceSelecionada },
});

// 4. Iniciar pagamento e abrir pagamento.linkPagamento no navegador.
const pagamento = await apiRequest(`parcelas/pagar/${idParcelaSelecionada}`, {
  method: "POST",
  token,
});

// 5. Ao retornar do navegador, sincronizar. Só PAGA confirma a quitação.
const parcelaAtualizada = await apiRequest(
  `parcelas/atualizar_pagamento/${idParcelaSelecionada}`,
  { method: "POST", token },
);
const pagamentoConfirmado = parcelaAtualizada.status === "PAGA";
```

## 11. Instruções para a IA que vai gerar o aplicativo

Use este contrato como fonte das rotas e dos formatos reais. Este documento é
para **testes locais**, não para publicação: a IA deve configurar `API_ENDPOINT`
com a URL local da seção 2, sem criar ou presumir um domínio público.
A tecnologia
mobile fica a critério do projeto; não altere o contrato para se adequar a uma
biblioteca ou invente endpoints REST que não existam.

Implemente as telas de login, cadastro PF, perfil, lista de parcelas, detalhe
da parcela e acompanhamento de pagamento. A troca de senha deve ficar
condicionada à correção indicada. Use dados reais da API depois de configurar
a URL; não substituir falhas por respostas falsas de sucesso.

Concentre a URL local e o tratamento de autenticação em um cliente HTTP.
Inclua estados de carregamento, erro de rede, sessão expirada, lista vazia,
pagamento em aberto e pagamento confirmado. Mantenha valores em centavos
durante cálculos de parcelas e formate em reais apenas para apresentação.

Não implementar, por falta de contrato disponível: refresh token, recuperação
de senha por e-mail, edição de perfil, upload de foto, exclusão de conta,
cadastro PJ, verificação de código, notificações, estorno, Pix nativo,
coleta de cartão no app, criação de checkout próprio ou chamada ao webhook.
Se o app exigir essas funções, solicitar implementação no backend antes.

O aplicativo cliente pode usar `/apolices/get_all` para listar suas próprias
apólices. Não deve listar todos os clientes ou cadastrar funcionários. As
restrições visuais não corrigem a falta de autorização dessas outras rotas.

## 12. Pendências verificadas no backend atual

Esta seção descreve limitações encontradas, sem alterar o backend durante a
produção deste documento. As funções afetadas não devem ser tratadas pela IA
como prontas para consumo.

| Rota/recurso | Situação encontrada |
| --- | --- |
| `POST /users_PJ` | Aponta para `UserController@createUserPJ`, método ausente. |
| `POST /auth/verify_code` | Aponta para `UserController@verifyCode`, método ausente. Há um método em `AuthController`, mas a rota não aponta para ele. |
| `POST /stripe/webhook` | Rota cadastrada; `StripeWebhookController` e `StripeWebhookService` não encontrados nesta cópia. Não depender da baixa automática até restaurar e testar. |
| `GET /test/private` e `GET /test/admin` | Apontam para `TestController`, que não foi encontrado. Não são endpoints úteis ao app. |
| Troca de senha de cliente | SQL atual usa `cliente.id`; o esquema consultado tem `cliente.idCliente`. |
| Perfil de funcionário | `/profile` consulta clientes, não funcionários. |
| Consulta individual de apólice, listagem de clientes e cadastro de funcionário | Exigem JWT, mas ainda não aplicam os limites por dono/role necessários. A listagem `/apolices/get_all` já filtra por vínculo de cliente ou funcionário. |
| Confirmação de cadastro por e-mail | Envio usa sandbox SMTP; rota de validação está incorreta. |
| Sessão | Não há renovação de token, revogação ou logout no servidor. |
| Configuração de segredos | A assinatura JWT e configurações SMTP estão no código; mover para configuração privada do servidor antes de publicar. Não copiar seus valores para este documento ou para o mobile. |

Para executar este contrato agora, mantenha Apache e MySQL ativos no XAMPP,
o `.env` com a conexão do MySQL local e as chaves de teste do Stripe. Preserve
o header `Authorization` no servidor. Não copie segredos para o aplicativo.

No dispositivo físico ou no emulador, confirme que `API_ENDPOINT` alcança o
computador do XAMPP conforme a seção 2.1. O aplicativo não precisa de uma
hospedagem pública para consumir a API neste teste. Uma eventual publicação
será configurada separadamente; não antecipar essa troca de ambiente no app.

## 13. Mapa completo das rotas cadastradas

"Implementada" indica existência da ação no código; consulte as limitações
acima para as funções com pendências. A listagem de apólices aplica o vínculo
de cliente/funcionário, e parcelas aplicam seu próprio escopo por cliente.
As demais rotas privadas abaixo não devem ser presumidas como
restritas por dono ou por role apenas por exigirem JWT.

| Método | Rota lógica | Autenticação cadastrada | Disponibilidade |
| --- | --- | --- | --- |
| POST | `/users_PF` | Pública | Implementada; envio de e-mail usa sandbox. |
| POST | `/users_PJ` | Pública | Método ausente. |
| POST | `/auth/verify_code` | Pública | Método ausente no controller indicado. |
| POST | `/auth/login` | Pública | Implementada. |
| POST | `/stripe/webhook` | Assinatura Stripe prevista; sem JWT | Controller ausente nesta cópia. Não é chamada mobile. |
| GET | `/profile` | JWT | Implementada para cliente. |
| POST | `/profile/change_password` | JWT | Implementada com pendência no SQL. |
| GET | `/getclientes` | JWT | Lista global; referência administrativa. |
| GET | `/test/private` | JWT | Controller ausente. |
| GET | `/test/admin` | JWT com role `admin` | Controller ausente. |
| POST | `/funcionario` | JWT | Implementada; sucesso sem JSON. |
| POST | `/apolice` | JWT | Implementada; usa `sub` como funcionário. |
| GET | `/apolices/get_all` | JWT | Lista apenas apólices vinculadas ao cliente ou funcionário autenticado. |
| GET | `/apolices/get/{numeroApolice}` | JWT | Busca por número textual; não aplica dono. |
| GET | `/parcelas/get_all` | JWT | Implementada; filtro opcional `idApolice`. |
| GET | `/parcelas/get/{id}` | JWT | Implementada; ID numérico da parcela. |
| POST | `/parcelas/pagar/{id}` | JWT | Implementada; retorna link Stripe. |
| POST | `/parcelas/atualizar_pagamento/{id}` | JWT | Implementada; sincronização manual. |
