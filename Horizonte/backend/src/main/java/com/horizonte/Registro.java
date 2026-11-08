package com.horizonte;

public class Registro {
    private final String cpf;
    private final Situacao situacao;
    private final int score;
    public Registro(String cpf, Situacao situacao, int score){
        if(!Pessoa.validar(cpf)) throw new IllegalArgumentException("CPF do registro invalido");
        if(situacao == null) throw new IllegalArgumentException("Situacao do registro e obrigatorio");
        if(score < 0 || score > 1000) throw new IllegalArgumentException("Score deve estar entre 0 e 1000");
        this.cpf = cpf.replaceAll("\\D", ""); this.situacao = situacao; this.score = score;}

    public boolean aprovado(){return situacao == Situacao.REGULAR && score >= 500;}

    public String getCpf(){return cpf;}
    public Situacao getSituacao(){return situacao;}
    public int getScore(){return score;}
}
