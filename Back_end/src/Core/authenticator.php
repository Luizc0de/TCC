<?php 

    namespace App\Core;

    class authenticator 
    {
        public static function generateToken()
        {
            return mt_rand(0000, 9999);
        }


    }
?>