package com.horizonte;

public class Cliente extends Pessoa{
    private final double renda;
    private String status = "Novo";
    private final int imovel;
    public Cliente(String nome, String cpf, double renda, int imovel) {
        super(nome, cpf);
        if (!Double.isFinite(renda) || renda <= 0) throw new IllegalArgumentException("Renda deve ser maior que zero");
        if (imovel < 0) throw new IllegalArgumentException("Codigo do imovel nao pode ser negativo");
        this.renda = renda; this.imovel = imovel;
    }
    @Override
    public String getPerfil(){ return "Cliente";}

    public double getRenda(){return renda;}
    public String getStatus(){return status;}
    public int getImovel(){return imovel;}
    public void setStatus(String status){
        if(!"Novo".equals(status) && !"Em analise".equals(status) && !"Em atendimento".equals(status) && !"Concluido".equals(status))
            throw new IllegalArgumentException("Status invalido: " + status);
        this.status = status;
    }
}
