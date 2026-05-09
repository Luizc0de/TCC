<?php

namespace App\Core;

class Request
{
    public static function method()
    {
        return $_SERVER["REQUEST_METHOD"];
    }
}
?>