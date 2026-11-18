<?php

namespace App\Models;

class Apolice
{
	private ?int $idApolice;
	private string $numeroApolice;
	private ?string $dataAssinatura;
	private ?string $dataVencimento;
	private string $status;
	private string $tipoApolice;
	private ?string $valorTotal;
	private ?int $quantidadeParcelas;
	private int $idCliente;
	private ?int $idFuncionario;

	public function __construct(
		string $numeroApolice,
		?string $dataAssinatura,
		?string $dataVencimento,
		string $status,
		string $tipoApolice,
		?string $valorTotal,
		?int $quantidadeParcelas,
		int $idCliente,
		?int $idFuncionario = null,
		?int $idApolice = null
	) {
		$this->numeroApolice = $numeroApolice;
		$this->dataAssinatura = $dataAssinatura;
		$this->dataVencimento = $dataVencimento;
		$this->status = $status;
		$this->tipoApolice = $tipoApolice;
		$this->valorTotal = $valorTotal;
		$this->quantidadeParcelas = $quantidadeParcelas;
		$this->idCliente = $idCliente;
		$this->idFuncionario = $idFuncionario;
		$this->idApolice = $idApolice;
	}

	public function getIdApolice(): ?int
	{
		return $this->idApolice;
	}

	public function getNumeroApolice(): string
	{
		return $this->numeroApolice;
	}

	public function getDataAssinatura(): ?string
	{
		return $this->dataAssinatura;
	}

	public function getDataVencimento(): ?string
	{
		return $this->dataVencimento;
	}

	public function getStatus(): string
	{
		return $this->status;
	}

	public function getTipoApolice(): string
	{
		return $this->tipoApolice;
	}

	public function getValorTotal(): ?string
	{
		return $this->valorTotal;
	}

	public function getQuantidadeParcelas(): ?int
	{
		return $this->quantidadeParcelas;
	}

	public function getIdCliente(): int
	{
		return $this->idCliente;
	}

	public function getIdFuncionario(): ?int
	{
		return $this->idFuncionario;
	}
}
