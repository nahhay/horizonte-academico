package com.horizonte;

public abstract class Pessoa implements Comparable<Pessoa> {
    private final String nome;
    private final String cpf;
    public Pessoa(String nome, String cpf){
        if(nome == null || nome.isBlank() || nome.trim().matches("\\d+"))
            throw new IllegalArgumentException("Nome invalido");
        if(!validar(cpf)) throw new IllegalArgumentException("CPF invalido");
        this.nome = nome.trim();
        this.cpf = cpf.replaceAll("\\D", "");
    }
    public abstract String getPerfil();

    public String getNome() { return nome; }
    public String getCpf() { return cpf; }

    public static boolean validar(String cpf) {
        if (cpf == null || !cpf.trim().matches("[0-9.\\-\\s]+")) return false;
        String n = cpf.replaceAll("\\D", "");
        if (n.length() != 11) return false;

        boolean iguais = true;
        for (int i = 1; i < n.length(); i++) {
            if (n.charAt(i) != n.charAt(0)) {
                iguais = false;
                break;
            }
        }
        if (iguais) return false;
        return digito(n, 9) == n.charAt(9) - '0' && digito(n, 10) == n.charAt(10) - '0';
    }

    private static int digito(String n, int qtd) {
        int soma = 0;
        for (int i = 0; i < qtd; i++) soma += (n.charAt(i) - '0') * (qtd + 1 - i);
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    @Override
    public int compareTo(Pessoa outra) { return nome.compareToIgnoreCase(outra.nome); }
}
