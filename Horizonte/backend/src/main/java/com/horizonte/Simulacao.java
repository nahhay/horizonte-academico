package com.horizonte;

public class Simulacao {
    public static final double ENTRADA = 0.2, JUROS = 0.008, LIMITE = 0.30;
    public static final int PRAZO = 360;
    private final double valor, entrada, financiado, parcela;
    private final boolean cabe;

    public Simulacao(double valor, double renda){
        if(!Double.isFinite(valor) || valor <= 0)
            throw new IllegalArgumentException("Valor do imovel deve ser maior que zero");
        if(!Double.isFinite(renda) || renda <= 0)
            throw new IllegalArgumentException("Renda deve ser maior que zero");
        this.valor = valor;
        this.entrada = valor * ENTRADA;
        this.financiado = valor - entrada;
        this.parcela = financiado * JUROS / (1 - Math.pow(1 + JUROS, -PRAZO));
        if(!Double.isFinite(parcela))
            throw new IllegalArgumentException("Valor muito alto para calcular o financiamento");
        this.cabe = parcela <= renda * LIMITE;
    }
    public double getValor(){return valor;}
    public double getEntrada(){return entrada;}
    public double getFinanciado(){return financiado;}
    public double getParcela(){return parcela;}
    public double getRendaNecessaria(){return parcela / LIMITE;}
    public boolean isCabe(){return cabe;}
    public double getTaxaAnual(){return (Math.pow(1 + JUROS, 12) -1) * 100;}
}
