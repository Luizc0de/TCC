<?php

namespace App\Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Email extends PHPMailer
{
    public function __construct()
    {
        parent::__construct(true);

        $this->isSMTP();
        $this->Host = $_ENV['EMAIL_HOST'] ?? 'smtp.gmail.com';
        $this->SMTPAuth = true;
        $this->Username = $_ENV['EMAIL_USERNAME'] ?? '244078.aluno@iserj.edu.br';
        $this->Password = $_ENV['EMAIL_PASSWORD'] ?? '';
        $this->Timeout = 10;
        $this->SMTPSecure = 'tls';
        $this->Port = (int) ($_ENV['EMAIL_PORT'] ?? 587);
        $this->CharSet = 'UTF-8';
    }

    public static function sendPasswordResetCode(string $to, string $code, int $minutos): void
    {
        $mail = new self();
        $mail->setFrom($_ENV['EMAIL_FROM'] ?? $mail->Username, 'Insurance - Suporte');
        $mail->addAddress($to);
        $mail->Subject = 'Código para redefinir sua senha - Insurance';
        $mail->Body = "Use o código $code para redefinir sua senha na Insurance. Ele vale por $minutos minutos.

Se você não solicitou a troca, ignore este e-mail.";
        $mail->send();
    }

    public static function sendVerificationCode($to, $code)
    {
        $mail = new self();

        // Template HTML embutido na própria classe
        $body = '
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"></head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: \'Segoe UI\', Tahoma, sans-serif;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #f1f5f9; padding: 40px 0;">
                <tr>
                    <td>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                            <tr>
                                <td align="center" style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 35px 20px;">
                                    <span style="color: #ffffff; font-size: 24px; font-weight: bold;">🛡️ Insurance</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px; color: #334155;">
                                    <h2 style="margin-top: 0; color: #0f172a; font-size: 22px;">Olá, seja bem-vindo(a)!</h2>
                                    <p style="font-size: 16px; line-height: 1.6; color: #475569;">Seu cadastro na <strong>Insurance</strong> foi realizado com sucesso.</p>
                                    <p style="font-size: 15px; color: #475569;">Seu código de autenticação é:</p>
                                    <div style="text-align: center; margin: 25px 0;">
                                        <span style="display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 15px 30px; font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 4px;">' . $code . '</span>
                                    </div>
                                    <p style="font-size: 14px; color: #64748b; margin-top: 25px;">Se você não solicitou este cadastro, ignore esta mensagem.</p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 Insurance. Proteção completa para você e sua família.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>';

        try {
            $mail->setFrom($_ENV['EMAIL_FROM'] ?? $mail->Username, 'Insurance - Suporte');
            $mail->addAddress($to);
            $mail->Subject = 'Cadastro realizado - Insurance';
            $mail->isHTML(true);
            $mail->Body = $body;

            $mail->send();

            return [
                'success' => true,
                'message' => 'Email enviado com sucesso.'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Não foi possível enviar o e-mail.',
                'error' => $e->getMessage()
            ];
        }
    }
}
