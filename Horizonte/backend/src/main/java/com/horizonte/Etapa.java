package com.horizonte;

public class Etapa {
    private final String nome;
    private final boolean ok;
    private final String detalhe;
    public Etapa(String nome, boolean ok, String detalhe){this.nome = nome; this.ok = ok; this.detalhe = detalhe;}

    public String getNome(){return nome;}
    public boolean isOk(){return ok;}
    public String getDetalhe(){return detalhe;}
}
