<?php

use App\Core\Routes;

Routes::get('/', 'UserController@index');
Routes::post('/users', 'UserController@store');
Routes::put('/users/{id}', 'UserController@update');
Routes::delete('/users/{id}', 'UserController@destroy');

?>