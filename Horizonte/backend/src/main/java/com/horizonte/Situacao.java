package com.horizonte;

public enum Situacao {
    REGULAR("Regular"), RESTRICAO("Com restricao"), NEGATIVADO("Negativo");

    private final String descricao;
    Situacao(String descricao){this.descricao = descricao;}
    public String getDescricao(){return descricao;}
}
