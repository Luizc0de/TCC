<?php

namespace App\Utils;

class Request
{
    public static function method()
    {
        return $_SERVER["REQUEST_METHOD"];
    }

    public static function validate(array $fields)
    {
        foreach ($fields as $field => $value) {
            if (empty(trim($value))) {
                throw new \Exception("The field ($field) is required.");
            }
        }

        return $fields;
    }

    public static function getBody()
    {
        $json = json_decode(file_get_contents('php://input'), true);

        return match(self::method()) {
            'GET' => $_GET,
            'POST' => $_POST ?: ($json ?? []),
            'PUT', 'DELETE' => $json ?? [],
            default => [],
        };
    }

}

?>