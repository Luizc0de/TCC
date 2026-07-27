<?php

use App\Core\Routes;

// Create routes for the application
Routes::post('/users_PF', 'UserController@createUserPF');
Routes::post('/users_PJ', 'UserController@createUserPJ');



?>