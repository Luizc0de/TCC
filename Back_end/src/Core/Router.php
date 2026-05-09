<?php

namespace App\Core;

use App\Core\Request;
use App\Core\Response;

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

                [$controller, $action] = explode('@', $route['action']);

                $controller = $prefixController . $controller;
                $extendController = new $controller();
                $extendController->$action(new Request, new Response, $matches);
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


?>