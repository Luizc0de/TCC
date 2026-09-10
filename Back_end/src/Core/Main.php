<?php

use App\Core\Routes;

// Rotas públicas
Routes::post('/users_PF', 'UserController@createUserPF');
Routes::post('/users_PJ', 'UserController@createUserPJ');

Routes::post('/auth/verify_code', 'UserController@verifyCode');
Routes::post('/auth/login', 'AuthController@login');
Routes::get('/test/public', 'TestController@publicRoute');



//privadas
Routes::get('/profile', 'UserController@getUserPF', true);
Routes::post('/profile/change_password', 'UserController@ChangePassword', true);

// polices



Routes::get('/test/private', 'TestController@privateRoute', true);

Routes::get('/test/admin', 'TestController@adminRoute', 'admin');

Routes::post('/funcionario', 'FuncionarioController@CreateFuncionario', true);
Routes::post('/apolice', 'ApoliceController@createApolice', true);

?>