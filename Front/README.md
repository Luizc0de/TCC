# Insurance - frontend estatico

Site em HTML e CSS, com JavaScript para login, cadastro e leitura do perfil pela API local.

Abra http://localhost/TCC/Front/ ou pages/home/index.html.

Cada pagina tem seu index.html e sua propria folha CSS na mesma pasta:

- pages/home/: index.html e home.css
- pages/seguros/: index.html e seguros.css
- pages/seguros/automovel/: index.html e automovel.css
- pages/seguros/celular/: index.html e celular.css
- pages/seguros/notebook/: index.html e notebook.css
- pages/simulador/: index.html e simulador.css
- pages/contato/: index.html e contato.css
- pages/conta/entrar/: index.html e entrar.css
- pages/conta/cadastro/: index.html e cadastro.css
- pages/conta/recuperar-senha/: index.html e recuperar-senha.css
- pages/conta/perfil/: index.html e perfil.css

A pasta assets guarda apenas imagens, a fonte local e sua licenca. O index.html da raiz encaminha para pages/home/index.html usando HTML.

Cabecalho, rodape e icones estao diretamente no HTML de cada pagina. Os menus usam o elemento nativo details. Contato, recuperacao de senha, simulador e cotacoes permanecem demonstrativos. O backend nao foi alterado.

Foto: Cytonn Photography / Unsplash, https://unsplash.com/photos/two-people-shaking-hands-n95VMLxqM2I
Fonte: Plus Jakarta Sans / Google Fonts. Licenca em assets/fonts/OFL.txt.

## Acesso conectado a API

- pages/conta/entrar/entrar.js: POST index.php?url=auth/login com email e password.
- pages/conta/cadastro/cadastro.js: POST index.php?url=users_PF com name, email, password e cpf.
- pages/conta/perfil/perfil.js: GET index.php?url=profile com Authorization: Bearer.

O endpoint e calculado relativamente a pasta Back_end, no mesmo host e porta do site. Abra pelo Apache do XAMPP, com MySQL ativo. O token fica apenas em sessionStorage, na chave insurance.authToken, ate sair ou encerrar a sessao da aba. Senhas nao sao armazenadas. Cada script fica junto do HTML e CSS da pagina correspondente.

Cadastro HTTP 201 significa conta criada, mesmo quando o backend informa falha no envio do e-mail. Nesse caso, a interface orienta a entrar sem reenviar o cadastro. A verificacao de codigo e a recuperacao de senha nao fazem parte desta integracao.

## Configuracao unica da API

Edite Front/config.js para ajustar os endpoints em `urls` (local e producao: https://api.insurance.dev.br/index.php). Nas telas de entrar e criar conta ha um seletor "API: Local | Produção" que grava a escolha em localStorage e vale para todas as telas. Sem escolha salva, usa Local em localhost e Produção nos demais hosts. Nao coloque senhas ou chaves secretas nesse arquivo publico.

A mesma configuracao vale abrindo o index.html pelo computador (file://), Live Server ou Apache. A API continua sendo um servidor HTTP/HTTPS ativo; no ambiente local, Apache e MySQL precisam estar ligados. O frontend envia a rota no parametro url, conforme o roteador PHP existente.

Se frontend e API estiverem em origens diferentes, a API deve autorizar CORS para a origem do frontend, POST/GET/OPTIONS e os cabecalhos Content-Type e Authorization. O backend local ja permite essas chamadas, inclusive a origem null usada por arquivos locais. Em producao, paginas HTTPS devem chamar uma API HTTPS.

## Area do cliente

Depois do login, o cliente entra em pages/cliente/home/index.html. As telas apolices, apolices/detalhes, parcelas e sinistro ficam em subpastas de pages/cliente, cada uma com index.html, CSS e JavaScript locais. Todas usam Front/config.js e o token insurance.authToken em sessionStorage, inclusive abrindo os arquivos diretamente.

Home consulta perfil, apolices, parcelas e sinistros. Apolices permitem busca e detalhes pelo numero textual. A API local agora inclui numeroApolice e resumo do bem na listagem e verifica o vinculo no detalhe. Publique os ajustes de ApoliceController, ApoliceService e ApoliceRepository ao atualizar a API de producao.

Parcelas mostram reais a partir de valorCentavos, preservam as datas de calendario e oferecem filtros. Pagar chama parcelas/pagar/{id} e abre exatamente o link Stripe retornado. O retorno por foco ou historico consulta atualizar_pagamento/{id}; o cliente so mostra PAGA depois da confirmacao da API. Ha atualizacao manual e nenhuma coleta de cartao no site.

Sinistro envia FormData com idApolice, descricao e imagem. A data da ocorrencia e incluida no texto da descricao, pois a API atual nao tem campo separado para ela. A imagem deve ser JPEG/PNG/WebP, ate 5 MiB, com os limites de dimensao do backend. A listagem e as imagens privadas usam autenticacao por header; nunca se inclui token na URL. O navegador mostra previa e protocolo sem simular aprovacao ou indenizacao.
