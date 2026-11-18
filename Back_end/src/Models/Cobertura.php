<?php

namespace App\Models;

class Cobertura
{
    public const CATALOGO = [
        'VEICULO' => [
            'modalidade' => 'Seguro Auto Compreensivo ou Roubo e Furto',
            'comuns' => [
                'COLISAO' => 'Colisão',
                'INCENDIO' => 'Incêndio',
                'ROUBO_FURTO' => 'Roubo e furto do veículo',
                'RCF_V' => 'RCF-V para danos materiais e corporais a terceiros',
                'ASSISTENCIA_24H' => 'Assistência 24h com guincho básico',
                'VIDROS' => 'Proteção de vidros',
                'CARRO_RESERVA' => 'Carro reserva por 7 a 15 dias',
            ],
            'profissionais' => [
                'USO_COMERCIAL_APP' => 'Uso comercial ou por aplicativo para transporte remunerado (Uber, 99) e entregas',
                'APP_PASSAGEIROS' => 'Acidentes pessoais de passageiros (APP) por morte ou invalidez de ocupantes',
                'RCF_V_AMPLIADA' => 'RCF-V com limite elevado para danos a terceiros',
                'CARRO_RESERVA_ESTENDIDO' => 'Carro reserva estendido por 15 a 30 dias',
                'LUCROS_CESSANTES' => 'Lucros cessantes com diárias por paralisação do veículo',
                'GUINCHO_AMPLIADO' => 'Guincho com quilometragem ampliada ou ilimitada',
            ],
        ],
        'TELEFONE' => [
            'modalidade' => 'Seguro para Celular e Portáteis',
            'comuns' => [
                'ROUBO_FURTO_QUALIFICADO' => 'Roubo sob ameaça ou furto qualificado do aparelho com vestígios de arrombamento',
                'QUEBRA_ACIDENTAL' => 'Quebra acidental, incluindo quedas e trincas na tela',
                'DANOS_LIQUIDOS' => 'Danos por líquidos ou oxidação',
                'GARANTIA_ESTENDIDA' => 'Extensão de garantia para defeitos funcionais',
            ],
            'profissionais' => [
                'APARELHO_CORPORATIVO' => 'Aparelho corporativo ou de MEI, vinculado ao CNPJ ou usado comercialmente',
                'TRANSACOES_DIGITAIS' => 'Transações digitais e Bolsa Protegida para Pix ou compras sob coação ou roubo do aparelho',
                'COBERTURA_INTERNACIONAL' => 'Cobertura internacional em viagens de trabalho',
                'APARELHO_SUBSTITUTO' => 'Aparelho substituto ou reposição prioritária para continuidade do trabalho',
            ],
        ],
        'NOTEBOOK' => [
            'modalidade' => 'Seguro de Equipamentos Portáteis, individual ou multi-itens',
            'comuns' => [
                'ROUBO_FURTO_QUALIFICADO' => 'Roubo e furto qualificado do notebook',
                'DANOS_FISICOS' => 'Danos físicos por acidente, como quedas e colisões',
                'DANOS_ELETRICOS' => 'Danos elétricos por curto-circuito ou oscilação de energia',
                'DANOS_LIQUIDOS' => 'Danos por água ou outros líquidos',
            ],
            'profissionais' => [
                'ALUGUEL' => 'Aluguel de notebook reserva durante o conserto ou perda de receita de locação a terceiros',
                'MULTI_ITENS' => 'Apólice multi-itens ou empresarial para equipamentos de trabalho, como notebooks, câmeras e tablets',
                'TRANSITO_EXTERIOR' => 'Cobertura em trânsito e no exterior, fora do endereço comercial',
                'ACESSORIOS_PROFISSIONAIS' => 'Acessórios profissionais declarados, como periféricos, docking stations e equipamentos acoplados',
            ],
        ],
    ];

    public static function selecionar(string $tipoBem, string $finalidade, $codigos): array
    {
        if (!is_array($codigos) || !$codigos || array_values($codigos) !== $codigos) {
            throw new \DomainException('Envie coberturas como uma lista com pelo menos um código.', 400);
        }
        $produto = self::CATALOGO[$tipoBem];
        $disponiveis = $produto['comuns'];
        if (in_array(strtoupper(trim($finalidade)), ['PROFISSIONAL', 'COMERCIAL', 'RENDA'], true)) {
            $disponiveis += $produto['profissionais'];
        }
        $selecionadas = [];
        foreach ($codigos as $codigo) {
            if (!is_string($codigo) || !isset($disponiveis[$codigo])) {
                throw new \DomainException('Cobertura indisponível para o bem ou para sua finalidade de uso.', 400);
            }
            if (isset($selecionadas[$codigo])) {
                throw new \DomainException('Cada cobertura pode ser selecionada apenas uma vez.', 400);
            }
            $selecionadas[$codigo] = ['codigo' => $codigo, 'descricao' => $disponiveis[$codigo]];
        }
        return array_values($selecionadas);
    }
}
