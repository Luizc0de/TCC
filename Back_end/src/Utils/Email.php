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
        $this->Host = 'sandbox.smtp.mailtrap.io';
        $this->SMTPAuth = true;
        $this->Username = '746b3e8c23eb66';
        $this->Password = '077b2b554c4091';
        $this->SMTPSecure = 'tls';
        $this->Port = 2525;
        $this->CharSet = 'UTF-8';
    }

    public static function sendEmail($to = 'luizmiquel3628@gmail.com', $subject = 'Test Email', $body = 'This is a test email sent from PHPMailer.')
    {
        $mail = new self();

        try {
            $mail->setFrom('luizmiguelofficer@gmail.com', 'luiz miguel');
            $mail->addAddress($to);
            $mail->Subject = $subject;
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