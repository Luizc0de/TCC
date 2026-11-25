UPDATE apolice a
JOIN parcela p ON p.idApolice = a.idApolice
SET a.status = 'ATIVA'
WHERE a.status = 'APROVADA' AND p.numeroParcela = 1 AND p.status = 'PAGA';
