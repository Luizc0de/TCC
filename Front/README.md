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

Edite Front/config.js e defina apiBaseUrl com o endpoint completo da API. O padrao local e http://localhost/TCC/Back_end/index.php. Para producao, troque esse valor por https://seu-dominio/Back_end/index.php (ajuste ao caminho real). Todas as tres telas carregam essa configuracao antes do seu proprio script. Nao coloque senhas ou chaves secretas nesse arquivo publico.

A mesma configuracao vale abrindo o index.html pelo computador (file://), Live Server ou Apache. A API continua sendo um servidor HTTP/HTTPS ativo; no ambiente local, Apache e MySQL precisam estar ligados. O frontend envia a rota no parametro url, conforme o roteador PHP existente.

Se frontend e API estiverem em origens diferentes, a API deve autorizar CORS para a origem do frontend, POST/GET/OPTIONS e os cabecalhos Content-Type e Authorization. O backend local ja permite essas chamadas, inclusive a origem null usada por arquivos locais. Em producao, paginas HTTPS devem chamar uma API HTTPS.
