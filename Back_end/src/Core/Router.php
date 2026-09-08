<?php

namespace App\Core;

use App\Utils\Request;
use App\Utils\Response;
use App\Core\JwtService;


Class Router {

    public static function dispatch($routes){
        $url = '/';

        isset($_GET['url']) && $url .= $_GET['url'];

        $url !== '/' && $url = rtrim($url, '/');

        $prefixController = 'App\\Controllers\\';

        $routeFound = false;

        foreach ($routes as $route) {
            $pattern = '#^'. preg_replace('/{id}/', '([\w-]+)', $route['path']) .'$#';

            if (preg_match($pattern, $url, $matches)) {
                array_shift($matches);

                $routeFound = true;

                if ($route['method'] !== Request::method()) {
                    Response::json([
                        'error'   => true,
                        'success' => false,
                        'message' => 'Sorry, method not allowed.'
                    ], 405);
                    return;
                }

                // Rota privada: exige token válido (e role, se especificada)
                $auth = $route['auth'] ?? false;
                $request = new Request();

                if ($auth === true) {
                    $user = JwtService::authenticate();
                    $request->setUser($user);
                } elseif (is_string($auth) && $auth !== '') {
                    $user = JwtService::requireRole($auth);
                    $request->setUser($user);
                }

                [$controller, $action] = explode('@', $route['action']);

                $controller = $prefixController . $controller;
                $extendController = new $controller();
                $extendController->$action($request, new Response, $matches);
            }
        }

        if (!$routeFound) {
            Response::json([
                'error'   => true,
                'success' => false,
                'message' => 'Sorry, route not found.'
            ], 404);
        }
    }
}

