-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: sql309.infinityfree.com
-- Tempo de geração: 02-Jul-2026 às 22:14
-- Versão do servidor: 11.4.12-MariaDB
-- versão do PHP: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `if0_42200382_tccv1_bd`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `apolice`
--

CREATE TABLE `apolice` (
  `id_apolice` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `status_apolice` enum('ativa','fechada','inadimplente','cancelada') NOT NULL,
  `data_assinatura` date NOT NULL,
  `data_vencimento` date NOT NULL,
  `numero_apolice` decimal(10,2) DEFAULT NULL,
  `valor_total` enum('fixo','percentual') DEFAULT NULL,
  `tipo_apolice` varchar(50) DEFAULT NULL,
  `quantidade_parcela` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `apolice`
--

INSERT INTO `apolice` (`id_apolice`, `id_cliente`, `status_apolice`, `data_assinatura`, `data_vencimento`, `numero_apolice`, `valor_total`, `tipo_apolice`, `quantidade_parcela`) VALUES
(1, 0, 'ativa', '2024-01-15', '2025-01-15', '500.00', 'fixo', 'Compreensiva', 1),
(2, 0, 'ativa', '2024-03-10', '2025-03-10', '10.00', 'percentual', 'Multirrisco', 2),
(3, 0, 'fechada', '2023-06-20', '2024-06-20', '300.00', 'fixo', 'Danos a terceiros', 3),
(4, 0, 'inadimplente', '2024-08-01', '2025-08-01', '15.00', 'percentual', 'Compreensiva', 4),
(5, 0, 'ativa', '2024-09-15', '2025-09-15', '600.00', 'fixo', 'Multirrisco', 1),
(6, 0, 'cancelada', '2023-11-01', '2024-11-01', '0.00', 'fixo', 'Recibo', 2);

-- --------------------------------------------------------

--
-- Estrutura da tabela `avaliacao_financeira`
--

CREATE TABLE `avaliacao_financeira` (
  `id_avaliacao` int(11) NOT NULL,
  `id_apolice` int(11) DEFAULT NULL,
  `data_avaliacao` date NOT NULL,
  `metodo_avaliacao` varchar(50) DEFAULT NULL,
  `valor_seguravel` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `avaliacao_financeira`
--

INSERT INTO `avaliacao_financeira` (`id_avaliacao`, `id_apolice`, `data_avaliacao`, `metodo_avaliacao`, `valor_seguravel`) VALUES
(1, 1, '2024-01-10', 'Mercado', '85000.00'),
(2, 2, '2024-03-05', 'Custo de reposição', '120000.00'),
(3, 3, '2023-06-15', 'Valor de compra', '150000.00'),
(4, 4, '2024-07-28', 'Mercado', '95000.00'),
(5, 5, '2024-09-10', 'Custo de reposição', '75000.00');

-- --------------------------------------------------------

--
-- Estrutura da tabela `beneficiario`
--

CREATE TABLE `beneficiario` (
  `id_beneficiario` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `grau_parentesco` varchar(30) DEFAULT NULL,
  `id_cliente` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `beneficiario`
--

INSERT INTO `beneficiario` (`id_beneficiario`, `nome`, `cpf`, `grau_parentesco`, `id_cliente`) VALUES
(1, 'Maria Santos', '222.333.444-55', 'Cônjuge', 1),
(2, 'Carlos Pereira', '444.555.666-77', 'Filho', 1),
(3, 'Roberto Santos', '555.666.777-88', 'Esposo', 2),
(4, 'Ana Oliveira', '333.444.555-66', 'Titular', 4);

-- --------------------------------------------------------

--
-- Estrutura da tabela `cliente`
--

CREATE TABLE `cliente` (
  `id_cliente` int(11) NOT NULL,
  `nome_razao` varchar(100) NOT NULL,
  `cpf` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cnpj` varchar(15) DEFAULT NULL,
  `data_nascimento` enum('PF','PJ') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `funcionario`
--

CREATE TABLE `funcionario` (
  `id_funcionario` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` int(14) NOT NULL,
  `salario` decimal(10,2) DEFAULT NULL,
  `setor` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `funcionario`
--

INSERT INTO `funcionario` (`id_funcionario`, `nome`, `cpf`, `salario`, `setor`) VALUES
(1, 'Carlos Silva', 123, '4500.00', 'Comercial'),
(2, 'Ana Oliveira', 987, '5200.00', 'Sinistros'),
(3, 'Roberto Santos', 456, '3800.00', 'Financeiro'),
(4, 'Juliana Costa', 789, '6100.00', 'Tecnologia');

-- --------------------------------------------------------

--
-- Estrutura da tabela `indenizacao`
--

CREATE TABLE `indenizacao` (
  `id_indenizacao` int(11) NOT NULL,
  `id_sinistro` int(11) DEFAULT NULL,
  `data_pagamento` date NOT NULL,
  `valor_indenizacao` decimal(15,2) NOT NULL,
  `beneficiario` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `indenizacao`
--

INSERT INTO `indenizacao` (`id_indenizacao`, `id_sinistro`, `data_pagamento`, `valor_indenizacao`, `beneficiario`) VALUES
(1, 2, '2024-10-15', '85000.00', 'Maria Santos');

-- --------------------------------------------------------

--
-- Estrutura da tabela `parcela`
--

CREATE TABLE `parcela` (
  `id_parcela` int(11) NOT NULL,
  `id_apolice` int(11) DEFAULT NULL,
  `numero_parcela` int(11) NOT NULL,
  `valor_parcela` decimal(10,2) NOT NULL,
  `data_vencimento` date NOT NULL,
  `data_pagamento` date DEFAULT NULL,
  `status_pagamento` enum('pendente','paga','atrasada','cancelada') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `parcela`
--

INSERT INTO `parcela` (`id_parcela`, `id_apolice`, `numero_parcela`, `valor_parcela`, `data_vencimento`, `data_pagamento`, `status_pagamento`) VALUES
(1, 1, 1, '1500.00', '2024-02-15', '2024-02-15', 'paga'),
(2, 1, 2, '1500.00', '2024-03-15', '2024-03-20', 'atrasada'),
(3, 1, 3, '1500.00', '2024-04-15', NULL, 'pendente'),
(4, 2, 1, '2000.00', '2024-04-10', '2024-04-10', 'paga'),
(5, 2, 2, '2000.00', '2024-05-10', NULL, 'pendente'),
(6, 3, 1, '3000.00', '2023-07-20', '2023-07-20', 'paga'),
(7, 4, 1, '1800.00', '2024-09-01', NULL, 'pendente'),
(8, 5, 1, '2200.00', '2024-10-15', '2024-10-15', 'paga');

-- --------------------------------------------------------

--
-- Estrutura da tabela `pessoa`
--

CREATE TABLE `pessoa` (
  `id_pessoa` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `endereco` varchar(150) DEFAULT NULL,
  `grau_parentesco` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `pessoa`
--

INSERT INTO `pessoa` (`id_pessoa`, `nome`, `cpf`, `endereco`, `grau_parentesco`) VALUES
(1, 'João Pereira', '111.222.333-44', 'Rua A, 123 - SP', 'Titular'),
(2, 'Maria Santos', '222.333.444-55', 'Av. B, 456 - RJ', 'Cônjuge'),
(3, 'Carlos Pereira', '444.555.666-77', 'Rua A, 123 - SP', 'Filho'),
(4, 'Ana Oliveira', '333.444.555-66', 'Rua D, 321 - SP', 'Titular');

-- --------------------------------------------------------

--
-- Estrutura da tabela `seguro_vida`
--

CREATE TABLE `seguro_vida` (
  `id_seguro_vida` int(11) NOT NULL,
  `id_apolice` int(11) DEFAULT NULL,
  `id_pessoa` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `seguro_vida`
--

INSERT INTO `seguro_vida` (`id_seguro_vida`, `id_apolice`, `id_pessoa`) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 4, 4),
(4, 5, 3);

-- --------------------------------------------------------

--
-- Estrutura da tabela `sinistro`
--

CREATE TABLE `sinistro` (
  `id_sinistro` int(11) NOT NULL,
  `id_apolice` int(11) DEFAULT NULL,
  `data_ocorrido` date NOT NULL,
  `Descrição` varchar(150) DEFAULT NULL,
  `vistoria` tinyint(1) DEFAULT 0,
  `tipo_sinistro` enum('parcial','total') NOT NULL,
  `status_sinistro` enum('em_analise','aprovado','negado') DEFAULT 'em_analise'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Extraindo dados da tabela `sinistro`
--

INSERT INTO `sinistro` (`id_sinistro`, `id_apolice`, `data_ocorrido`, `Descrição`, `vistoria`, `tipo_sinistro`, `status_sinistro`) VALUES
(1, 1, '2024-08-10', 'João Pereira e terceiro', 1, 'parcial', 'em_analise'),
(2, 2, '2024-09-25', 'Maria Santos', 1, 'total', 'aprovado'),
(3, 3, '2024-01-20', 'Tech Solutions LTDA', 0, 'parcial', 'negado'),
(4, 4, '2024-11-05', 'Ana Oliveira', 1, 'parcial', 'em_analise');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `apolice`
--
ALTER TABLE `apolice`
  ADD PRIMARY KEY (`id_apolice`),
  ADD KEY `id_cliente` (`quantidade_parcela`);

--
-- Índices para tabela `avaliacao_financeira`
--
ALTER TABLE `avaliacao_financeira`
  ADD PRIMARY KEY (`id_avaliacao`),
  ADD KEY `id_apolice` (`id_apolice`);

--
-- Índices para tabela `beneficiario`
--
ALTER TABLE `beneficiario`
  ADD PRIMARY KEY (`id_beneficiario`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Índices para tabela `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Índices para tabela `funcionario`
--
ALTER TABLE `funcionario`
  ADD PRIMARY KEY (`id_funcionario`),
  ADD UNIQUE KEY `cpf` (`cpf`) USING BTREE;

--
-- Índices para tabela `indenizacao`
--
ALTER TABLE `indenizacao`
  ADD PRIMARY KEY (`id_indenizacao`),
  ADD KEY `id_sinistro` (`id_sinistro`);

--
-- Índices para tabela `parcela`
--
ALTER TABLE `parcela`
  ADD PRIMARY KEY (`id_parcela`),
  ADD KEY `id_apolice` (`id_apolice`);

--
-- Índices para tabela `pessoa`
--
ALTER TABLE `pessoa`
  ADD PRIMARY KEY (`id_pessoa`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- Índices para tabela `seguro_vida`
--
ALTER TABLE `seguro_vida`
  ADD PRIMARY KEY (`id_seguro_vida`),
  ADD KEY `id_pessoa` (`id_pessoa`),
  ADD KEY `id_apolice` (`id_apolice`);

--
-- Índices para tabela `sinistro`
--
ALTER TABLE `sinistro`
  ADD PRIMARY KEY (`id_sinistro`),
  ADD KEY `id_apolice` (`id_apolice`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `apolice`
--
ALTER TABLE `apolice`
  MODIFY `id_apolice` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `avaliacao_financeira`
--
ALTER TABLE `avaliacao_financeira`
  MODIFY `id_avaliacao` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `beneficiario`
--
ALTER TABLE `beneficiario`
  MODIFY `id_beneficiario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `funcionario`
--
ALTER TABLE `funcionario`
  MODIFY `id_funcionario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `indenizacao`
--
ALTER TABLE `indenizacao`
  MODIFY `id_indenizacao` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `parcela`
--
ALTER TABLE `parcela`
  MODIFY `id_parcela` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `pessoa`
--
ALTER TABLE `pessoa`
  MODIFY `id_pessoa` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `seguro_vida`
--
ALTER TABLE `seguro_vida`
  MODIFY `id_seguro_vida` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `sinistro`
--
ALTER TABLE `sinistro`
  MODIFY `id_sinistro` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `indenizacao`
--
ALTER TABLE `indenizacao`
  ADD CONSTRAINT `indenizacao_ibfk_1` FOREIGN KEY (`id_sinistro`) REFERENCES `sinistro` (`id_sinistro`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limitadores para a tabela `parcela`
--
ALTER TABLE `parcela`
  ADD CONSTRAINT `parcela_ibfk_1` FOREIGN KEY (`id_apolice`) REFERENCES `apolice` (`id_apolice`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limitadores para a tabela `seguro_vida`
--
ALTER TABLE `seguro_vida`
  ADD CONSTRAINT `seguro_vida_ibfk_1` FOREIGN KEY (`id_apolice`) REFERENCES `apolice` (`id_apolice`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limitadores para a tabela `sinistro`
--
ALTER TABLE `sinistro`
  ADD CONSTRAINT `sinistro_ibfk_1` FOREIGN KEY (`id_apolice`) REFERENCES `apolice` (`id_apolice`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
