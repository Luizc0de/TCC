<?php

use App\Core\Routes;

// Rotas públicas
Routes::post('/users_PF', 'UserController@createUserPF');
Routes::post('/users_PJ', 'UserController@createUserPJ');

Routes::post('/auth/verify_code', 'UserController@verifyCode');
Routes::post('/auth/login', 'AuthController@login');

// O Stripe autentica esta rota pela assinatura, sem JWT de usuário.
Routes::post('/stripe/webhook', 'StripeWebhookController@receber');


//privadas
Routes::get('/profile', 'UserController@getUserPF', true);
Routes::post('/profile/change_password', 'UserController@ChangePassword', true);

// policesrou

Routes::get('/getclientes', 'UserController@Index', true);

Routes::get('/test/private', 'TestController@privateRoute', true);

Routes::get('/test/admin', 'TestController@adminRoute', 'admin');

Routes::post('/funcionario', 'FuncionarioController@CreateFuncionario', true);

// apolices
Routes::post('/apolice', 'ApoliceController@createApolice', true);
Routes::get('/apolices/get_all', 'ApoliceController@Index', true);
Routes::get('/apolices/get/{id}', 'ApoliceController@Show', true);

// parcelas
Routes::get('/parcelas/get_all', 'ParcelaController@Index', true);
Routes::get('/parcelas/get/{id}', 'ParcelaController@Show', true);
Routes::post('/parcelas/pagar/{id}', 'ParcelaController@Pagar', true);
Routes::post('/parcelas/atualizar_pagamento/{id}', 'ParcelaController@atualizarPagamento', true);


?>
