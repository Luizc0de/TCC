<?php 
namespace App\Controllers;

use App\Services\AuthServices;
use App\Services\RecuperacaoSenhaService;
use App\Utils\Request;
use App\Utils\Response;
use App\Core\JwtService;
class AuthController
{
    public function solicitarRecuperacao(): void
    {
        $this->recuperacao([RecuperacaoSenhaService::class, 'solicitar']);
    }

    public function verificarRecuperacao(): void
    {
        $this->recuperacao([RecuperacaoSenhaService::class, 'verificar']);
    }

    public function redefinirSenha(): void
    {
        $this->recuperacao([RecuperacaoSenhaService::class, 'redefinir']);
    }

    private function recuperacao(callable $acao): void
    {
        header('Cache-Control: no-store');
        try {
            $dados = Request::getBody();
            if (!is_array($dados)) throw new \DomainException('Informe os dados da recuperação.', 400);
            Response::json($acao($dados), 200);
        } catch (\DomainException $e) {
            Response::json(['error' => $e->getMessage()], $e->getCode());
        } catch (\Throwable $e) {
            error_log('Falha na recuperação de senha: ' . get_class($e));
            Response::json(['error' => 'Não foi possível recuperar a senha. Tente novamente mais tarde.'], 500);
        }
    }

    public function login()
    {
        $body = Request::getBody();

        try {
            $fields = Request::validate([
                'email' => $body['email']     ?? '',
                'password' => $body['password'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }

        $user = AuthServices::login($fields['email'], $fields['password']);

        if (!$user) {
            Response::json(['message' => 'Invalid email or password.'], 400);
            return;
        }

        $roles = is_array($user->roles) ? $user->roles : [$user->roles];
        $token = JwtService::generate($user->getEmail(), $user->getId(), $roles);

        Response::json(['message' => 'Login successful.', 'token' => $token, 'roles' => $roles], 200);
    }
    
    public function verifyCode()
    {
        $body = Request::getBody();
        
        try {
            $fields = Request::validate([
                'code' => $body['code']   ?? '',
                'email' => $body['email'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        
        return AuthServices::verifyCode($fields['code'], $fields['email']);
    }
}
