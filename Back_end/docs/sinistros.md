# Sinistros — abertura, consulta e imagem

Todas as rotas exigem `Authorization: Bearer TOKEN`. O token determina o
usuário; o app não envia um ID de cliente ou funcionário para escolher quem acessa.

| Método | Rota | Função |
| --- | --- | --- |
| POST | `/sinistro` | Cliente abre um sinistro com apólice, descrição e uma imagem. |
| GET | `/sinistros/get_all` | Lista sinistros vinculados ao usuário autenticado. |
| GET | `/sinistros/get_all?idApolice=7` | Filtra a listagem por apólice, mantendo a autorização. |
| GET | `/sinistros/get/{id}` | Consulta um sinistro pelo ID numérico. |
| GET | `/sinistros/imagem/{id}` | Retorna os bytes da imagem com autenticação. |

No roteamento explícito, use:

```text
http://localhost/TCC/Back_end/index.php?url=sinistro
http://localhost/TCC/Back_end/index.php?url=sinistros/get_all
http://localhost/TCC/Back_end/index.php?url=sinistros/get_all&idApolice=7
http://localhost/TCC/Back_end/index.php?url=sinistros/get/1
http://localhost/TCC/Back_end/index.php?url=sinistros/imagem/1
```

## Quem pode acessar

- Role `user`: abre sinistros somente em apólices do próprio `idCliente` e
  consulta apenas os sinistros dessas apólices.
- Roles `funcionario` e `admin`: consultam somente sinistros das apólices em
  que `idFuncionario` corresponde ao `sub` do token. Não têm acesso global e
  não podem abrir sinistro como cliente.
- Se houver roles de cliente e funcionário juntas, prevalece o perfil de funcionário.
- Funcionários sem vínculo e clientes sem sinistros recebem `[]` na listagem.
- Tentar consultar um sinistro ou sua imagem sem vínculo retorna 404.

O responsável é obtido da apólice, não de campos enviados pelo app. A associação
acompanha o vínculo atual da apólice. Este fluxo registra a ocorrência; não faz
análise de cobertura, aprovação, recusa ou pagamento de indenização.

## Abrir pelo Postman

1. Faça login como cliente e copie o JWT.
2. Use `GET /apolices/get_all` com esse token para preencher a seleção de apólice.
   O campo **`id`** de cada apólice é o valor enviado como **`idApolice`**.
3. Crie um POST para `http://localhost/TCC/Back_end/index.php?url=sinistro`.
4. Em **Authorization**, selecione **Bearer Token** e informe o JWT.
5. Em **Body → form-data**, adicione:

   | Chave | Tipo no Postman | Exemplo/regra |
   | --- | --- | --- |
   | `idApolice` | Text | `7`; inteiro positivo, apólice do cliente. |
   | `descricao` | Text | Relato do ocorrido, entre 1 e 5000 caracteres. |
   | `imagem` | **File** | Uma imagem JPEG, PNG ou WebP, até **5 MiB**. |

6. Envie a requisição. Não defina `Content-Type: application/json` nem escreva
   manualmente o header de multipart: o Postman precisa incluir o boundary.

O nome/extensão informado no upload não determina o tipo aceito: o backend
confere o conteúdo real. SVG, GIF, PDF, texto e arquivos disfarçados são recusados.
Dimensões máximas: 10000 pixels por lado e 40 milhões de pixels no total.
Não enviar base64 no JSON; o endpoint recebe arquivo multipart.

Resposta **201**:

```json
{
  "message": "Sinistro criado com sucesso.",
  "sinistro": {
    "idSinistro": 1,
    "idApolice": 7,
    "descricao": "O veículo sofreu uma colisão na lateral direita.",
    "status": "ABERTO",
    "dataAbertura": "2026-10-30 18:00:00",
    "numeroApolice": "AP-EXEMPLO123",
    "idCliente": 3,
    "idFuncionario": 2,
    "imagemUrl": "index.php?url=sinistros/imagem/1"
  }
}
```

`idFuncionario` pode ser `null`. `dataAbertura` usa o horário do banco no formato
`YYYY-MM-DD HH:MM:SS`, sem indicação de fuso. IDs são retornados como inteiros.

O status inicial sempre é `ABERTO`; `status`, `idCliente` e `idFuncionario`
enviados pelo consumidor não controlam a criação. Uma apólice pode ter mais de
um sinistro. Não há edição, exclusão ou mudança de status nesta implementação.

## Consumir no aplicativo

Exemplo JavaScript para envio multipart; use o mecanismo de arquivos da
tecnologia mobile escolhida. `arquivoImagem` é um arquivo obtido pelo seletor
de imagem, não o nome de um caminho no servidor:

```javascript
const API_ENDPOINT = "http://localhost/TCC/Back_end/index.php";
const url = new URL(API_ENDPOINT);
url.searchParams.set("url", "sinistro");

const form = new FormData();
form.append("idApolice", String(idApoliceSelecionada));
form.append("descricao", descricaoDigitada);
form.append("imagem", arquivoImagem);

const response = await fetch(url.toString(), {
  method: "POST",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: form,
});
const data = await response.json();
if (!response.ok) {
  throw new Error(data.error || "Não foi possível abrir o sinistro.");
}
```

Adapte `form.append("imagem", ...)` ao formato aceito pela plataforma: no navegador
é `File`/`Blob`; no mobile pode ser um descritor de arquivo com URI, nome e tipo.
Não force JSON.stringify em `FormData`. A biblioteca de transporte deve gerar
o header multipart com o boundary.

O GET da listagem retorna um **array direto** desses objetos, sem o envelope
`message`/`sinistro`. O GET de detalhe retorna um **objeto direto**. Sem resultados,
a listagem retorna `[]`. Não existe paginação implementada.

### Carregar a imagem privada

`imagemUrl` é uma referência relativa à pasta do backend. Resolva em relação
a `API_ENDPOINT`. Na chamada de imagem, envie o mesmo Bearer Token e trate a
resposta como bytes/arquivo, não JSON:

```javascript
const urlImagem = new URL(sinistro.imagemUrl, API_ENDPOINT);
const responseImagem = await fetch(urlImagem.toString(), {
  headers: { Authorization: `Bearer ${token}` },
});
if (!responseImagem.ok) {
  throw new Error("Não foi possível carregar a imagem do sinistro.");
}
const imagemBlob = await responseImagem.blob();
```

No navegador, é possível exibir o Blob com `URL.createObjectURL` e liberar a
URL ao desmontar a tela. No mobile, use uma requisição autenticada ou um
componente de imagem que aceite headers. Um `<img src="...">` sem Bearer Token
não autentica o pedido. Não coloque JWT em query string.

## Erros

| HTTP | Causa |
| --- | --- |
| 400 | ID inválido, descrição ausente/grande demais, imagem ausente/inválida ou dimensões excessivas. |
| 401 | Token ausente, inválido ou expirado. |
| 403 | Perfil não autorizado; funcionário tentando abrir sinistro como cliente. |
| 404 | Apólice não pertence ao cliente, sinistro fora do vínculo, sinistro inexistente ou imagem ausente. |
| 413 | Arquivo acima de 5 MiB ou corpo acima de 6 MiB. |
| 415 | Tipo real do arquivo não é JPEG, PNG ou WebP. |
| 500 | Falha interna, de banco ou de armazenamento; não retorna detalhes SQL. |

Exemplo:

```json
{
  "error": "Apólice não encontrada para este cliente."
}
```

Se o registro falhar depois de salvar a imagem, o backend desfaz a transação
e remove o arquivo que acabou de criar.

## Banco e hospedagem

A migração já foi aplicada no banco local durante a implementação. Para instalar
em outro banco/servidor, publique os arquivos e execute, na raiz do projeto:

```powershell
php Back_end/database/migrate_sinistro.php
```

Alternativamente, importe `database/migrations/20261030_create_sinistro.sql` no
phpMyAdmin do banco correto. A migração cria a tabela `sinistro`, ligada à tabela
`apolice`; não apaga nem altera registros das tabelas existentes. O comando pode
ser executado novamente, mas não adapta uma tabela antiga com estrutura diferente.

No site, após publicar e aplicar a migração, a base informada para o projeto é
`https://api.insurance.dev.br`. O endereço explícito equivalente será:

```text
https://api.insurance.dev.br/index.php?url=sinistro
```

As imagens ficam por padrão em `Back_end/storage/sinistros`, com nomes aleatórios,
sem usar o nome recebido no upload. Publique também `storage/.htaccess`, que bloqueia
acesso HTTP direto em Apache 2.4. O aplicativo obtém as imagens apenas pela rota
autenticada. Dê permissão de escrita dessa pasta ao processo PHP.

Para armazenar fora da pasta pública, configure no `.env` um caminho absoluto:

```dotenv
SINISTRO_STORAGE_DIR=/caminho/privado/sinistros
```

Essa variável é opcional e pertence apenas ao servidor. Em hospedagem sem
Apache/.htaccess, use armazenamento fora da pasta pública ou configure um bloqueio
equivalente. Faça backup do banco **e** dessa pasta e preserve os nomes dos arquivos.
Copiar apenas o banco não transfere as imagens.

Configure PHP e servidor para aceitar upload de pelo menos 5 MiB e corpo de
pelo menos 6 MiB. Limites menores da hospedagem podem recusar o envio antes do PHP.

## Teste automatizado

```powershell
php Back_end/tests/SinistroHttpTest.php
```

O teste inicia um servidor PHP efêmero em loopback, usa JWT e uploads multipart
reais, mas isola os dados em tabelas temporárias e as imagens em uma pasta exclusiva
de teste. Não lê nem altera registros reais e remove os arquivos ao encerrar.
Verifica acesso por cliente/funcionário, IDs coincidentes, imagem privada, arquivos
disfarçados, tamanho, campos obrigatórios e remoção da imagem após falha de banco.
