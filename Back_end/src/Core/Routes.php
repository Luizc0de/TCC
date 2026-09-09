<?php

namespace App\Core;

class Routes {
    
    private static $routes = [];

    public static function get(string $path, string $action, $auth = false){
        self::$routes[] = [
            'method' => 'GET',
            'path' => $path,
            'action' => $action,
            'auth' => $auth, // false = pública | true = privada | 'admin' etc = privada + role específica
        ];
    }

    public static function post(string $path, string $action, $auth = false){
        self::$routes[] = [
            'method' => 'POST',
            'path' => $path,
            'action' => $action,
            'auth' => $auth,
        ];
    }

    public static function put(string $path, string $action, $auth = false){
        self::$routes[] = [
            'method' => 'PUT',
            'path' => $path,
            'action' => $action,
            'auth' => $auth,
        ];
    }

    public static function delete(string $path, string $action, $auth = false){
        self::$routes[] = [
            'method' => 'DELETE',
            'path' => $path,
            'action' => $action,
            'auth' => $auth,
        ];
    }

    public static function routes(){
        return self::$routes;
    }

}
?>