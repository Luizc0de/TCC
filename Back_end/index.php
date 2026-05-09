<?php

require_once __DIR__ . "/vendor/autoload.php";

use App\Core\Router;
use App\Core\Routes;

require_once __DIR__ . "/src/Core/main.php";

Router::dispatch(Routes::routes());


?>
