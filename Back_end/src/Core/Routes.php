<?php

namespace App\Core;

class Routes {
    
    private static $routes = [];

    // Metodo para registar uma rota.
    // ele pega o caminho e a ação (controller@method) e armazena em um array de rotas.
    public static function get( string $path, string $action ){

        self::$routes[] = [
            'method' => 'GET',
            'path' => $path,
            'action' => $action
        ];

    }
    public static function post( string $path, string $action ){

        self::$routes[] = [
            'method' => 'POST',
            'path' => $path,
            'action' => $action
        ];

    }
    public static function put( string $path, string $action ){

        self::$routes[] = [
            'method' => 'PUT',
            'path' => $path,
            'action' => $action
        ];

    }
    public static function delete( string $path, string $action ){

        self::$routes[] = [
            'method' => 'DELETE',
            'path' => $path,
            'action' => $action
        ];

    }
    public static function routes(){
        return self::$routes;
    }

}
?>