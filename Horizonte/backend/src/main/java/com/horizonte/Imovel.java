package com.horizonte;

public class Imovel implements Comparable<Imovel> {
    private final int id;
    private final String endereco, bairro, tipo, finalidade;
    private final int quartos, banheiros;
    private final double area, preco;
    public Imovel(int id, String endereco, String bairro, String tipo, int quartos, int banheiros, double area, double preco, String finalidade) {
        if(endereco == null || endereco.isBlank() || endereco.trim().matches("\\d+") || bairro == null || bairro.isBlank() || bairro.trim().matches("\\d+"))
            throw new IllegalArgumentException("Endereco e bairro devem conter texto valido");
        if(id <= 0)
            throw new IllegalArgumentException("Codigo do imovel deve ser maior que zero");
        if(tipo == null || (!tipo.equals("Casa") && !tipo.equals("Apartamento") && !tipo.equals("Terreno")))
            throw new IllegalArgumentException("Tipo deve ser Casa, Apartamento ou Terreno");
        if(!(area > 0) || !(preco > 0) || Double.isInfinite(area) || Double.isInfinite(preco))
            throw new IllegalArgumentException("Área e preço devem ser maiores que zero");
        if(quartos < 0 || banheiros < 0)
            throw new IllegalArgumentException("Quartos e banheiros não podem ser negativos");
        if(!"Terreno".equals(tipo) && (quartos < 1 || banheiros < 1))
            throw new IllegalArgumentException("Casa ou apartamento deve ter pelo menos 1 quarto e 1 banheiro");
        if(!"Comprar".equals(finalidade) && !"Alugar".equals(finalidade))
            throw new IllegalArgumentException("Finalidade deve ser comprar ou alugar");

        this.id = id; this.endereco = endereco.trim(); this.bairro = bairro.trim(); this.tipo = tipo;
        this.quartos = quartos; this.banheiros = banheiros; this.area = area;
        this.preco = preco; this.finalidade = finalidade;
    }
    public boolean isAluguel() { return "Alugar".equals(finalidade); }

    public int getId() { return id; }
    public String getEndereco() { return endereco; }
    public String getBairro() { return bairro; }
    public String getTipo() { return tipo; }
    public String getFinalidade() { return finalidade; }
    public int getQuartos() { return quartos; }
    public int getBanheiros() { return banheiros; }
    public double getArea() { return area; }
    public double getPreco() { return preco; }

    @Override
    public int compareTo(Imovel o) { return Double.compare(preco, o.preco); }
}
