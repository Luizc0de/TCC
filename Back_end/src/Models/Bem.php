<?php

namespace App\Models;

class Bem
{
	private ?int $idBem;
	private string $tipoBem;
	private ?string $finalidade;
	private ?string $descricao;
	private ?string $valorAvaliacao;
	private ?int $areaConstruida;
	private ?string $tipoImovel;
	private ?string $inscricaoImobiliaria;
	private ?string $placa;
	private ?string $chassi;
	private ?string $marca;
	private ?string $modeloVeiculo;
	private ?string $dataFabricacao;
	private ?string $numeroSerie;
	private ?string $modelo;
	private ?string $tipoMaquinario;
	private ?string $tipoEletronico;
	private ?string $nomeSegurado;
	private ?string $cpf;
	private ?string $createdAt;
	private ?string $updatedAt;

	public function __construct(
		string $tipoBem,
		?string $finalidade = null,
		?string $descricao = null,
		?string $valorAvaliacao = null,
		?int $areaConstruida = null,
		?string $tipoImovel = null,
		?string $inscricaoImobiliaria = null,
		?string $placa = null,
		?string $chassi = null,
		?string $marca = null,
		?string $modeloVeiculo = null,
		?string $dataFabricacao = null,
		?string $numeroSerie = null,
		?string $modelo = null,
		?string $tipoMaquinario = null,
		?string $tipoEletronico = null,
		?string $nomeSegurado = null,
		?string $cpf = null,
		?int $idBem = null,
		?string $createdAt = null,
		?string $updatedAt = null
	) {
		$this->idBem = $idBem;
		$this->tipoBem = $tipoBem;
		$this->finalidade = $finalidade;
		$this->descricao = $descricao;
		$this->valorAvaliacao = $valorAvaliacao;
		$this->areaConstruida = $areaConstruida;
		$this->tipoImovel = $tipoImovel;
		$this->inscricaoImobiliaria = $inscricaoImobiliaria;
		$this->placa = $placa;
		$this->chassi = $chassi;
		$this->marca = $marca;
		$this->modeloVeiculo = $modeloVeiculo;
		$this->dataFabricacao = $dataFabricacao;
		$this->numeroSerie = $numeroSerie;
		$this->modelo = $modelo;
		$this->tipoMaquinario = $tipoMaquinario;
		$this->tipoEletronico = $tipoEletronico;
		$this->nomeSegurado = $nomeSegurado;
		$this->cpf = $cpf;
		$this->createdAt = $createdAt;
		$this->updatedAt = $updatedAt;
	}

	public function getIdBem(): ?int
	{
		return $this->idBem;
	}

	public function getTipoBem(): string
	{
		return $this->tipoBem;
	}

	public function getFinalidade(): ?string
	{
		return $this->finalidade;
	}

	public function getDescricao(): ?string
	{
		return $this->descricao;
	}

	public function getValorAvaliacao(): ?string
	{
		return $this->valorAvaliacao;
	}

	public function getAreaConstruida(): ?int
	{
		return $this->areaConstruida;
	}

	public function getTipoImovel(): ?string
	{
		return $this->tipoImovel;
	}

	public function getInscricaoImobiliaria(): ?string
	{
		return $this->inscricaoImobiliaria;
	}

	public function getPlaca(): ?string
	{
		return $this->placa;
	}

	public function getChassi(): ?string
	{
		return $this->chassi;
	}

	public function getMarca(): ?string
	{
		return $this->marca;
	}

	public function getModeloVeiculo(): ?string
	{
		return $this->modeloVeiculo;
	}

	public function getDataFabricacao(): ?string
	{
		return $this->dataFabricacao;
	}

	public function getNumeroSerie(): ?string
	{
		return $this->numeroSerie;
	}

	public function getModelo(): ?string
	{
		return $this->modelo;
	}

	public function getTipoMaquinario(): ?string
	{
		return $this->tipoMaquinario;
	}

	public function getTipoEletronico(): ?string
	{
		return $this->tipoEletronico;
	}

	public function getNomeSegurado(): ?string
	{
		return $this->nomeSegurado;
	}

	public function getCpf(): ?string
	{
		return $this->cpf;
	}

	public function getCreatedAt(): ?string
	{
		return $this->createdAt;
	}

	public function getUpdatedAt(): ?string
	{
		return $this->updatedAt;
	}
}