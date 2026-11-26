<?php

use App\Core\Routes;

// Rotas públicas
Routes::post('/users_PF', 'UserController@createUserPF');
Routes::post('/users_PJ', 'UserController@createUserPJ');

Routes::post('/auth/verify_code', 'UserController@verifyCode');
Routes::post('/auth/login', 'AuthController@login');
Routes::post('/auth/recuperar-senha/solicitar', 'AuthController@solicitarRecuperacao');
Routes::post('/auth/recuperar-senha/verificar', 'AuthController@verificarRecuperacao');
Routes::post('/auth/recuperar-senha/redefinir', 'AuthController@redefinirSenha');

// O Stripe autentica esta rota pela assinatura, sem JWT de usuário.
Routes::post('/stripe/webhook', 'StripeWebhookController@receber');


//privadas
Routes::get('/profile', 'UserController@getUserPF', true);
Routes::post('/profile/change_password', 'UserController@ChangePassword', 'user');

// policesrou

Routes::get('/getclientes', 'UserController@Index', ['funcionario', 'vendas']);

Routes::get('/test/private', 'TestController@privateRoute', true);

Routes::get('/test/admin', 'TestController@adminRoute', 'admin');

Routes::post('/funcionario', 'FuncionarioController@createFuncionario', ['funcionario', 'rh']);

// apolices
Routes::post('/apolice', 'ApoliceController@createApolice', ['funcionario', 'vendas']);
Routes::get('/apolices/coberturas', 'ApoliceController@coberturas', ['funcionario', 'vendas']);
Routes::get('/apolices/vendas/{id}', 'ApoliceController@detalheVenda', ['funcionario', 'vendas']);
Routes::get('/apolices/em_analise', 'ApoliceController@emAnalise', ['funcionario', 'analise_risco']);
Routes::put('/apolices/analisar/{id}', 'ApoliceController@analisar', ['funcionario', 'analise_risco']);
Routes::get('/apolices/get_all', 'ApoliceController@Index', true);
Routes::get('/apolices/get/{id}', 'ApoliceController@Show', true);

// parcelas
Routes::get('/parcelas/get_all', 'ParcelaController@Index', true);
Routes::get('/parcelas/get/{id}', 'ParcelaController@Show', true);
Routes::post('/parcelas/pagar/{id}', 'ParcelaController@Pagar', true);
Routes::post('/parcelas/atualizar_pagamento/{id}', 'ParcelaController@atualizarPagamento', true);

// sinistros
Routes::post('/sinistro', 'SinistroController@criar', true);
Routes::get('/sinistros/get_all', 'SinistroController@Index', true);
Routes::get('/sinistros/get/{id}', 'SinistroController@Show', true);
Routes::get('/sinistros/imagem/{id}', 'SinistroController@imagem', true);
Routes::put('/sinistros/analisar/{id}', 'SinistroController@analisar', ['funcionario', 'atendimento']);


?>
