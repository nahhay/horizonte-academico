package com.horizonte;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class Corretor implements Analise {
    private final List<Registro> registros = new ArrayList<>();
    private int prox = 1;

    public Corretor() {
        this(1);
    }

    public Corretor(int prox) {
        if (prox < 1) throw new IllegalArgumentException("Protocolo invalido");
        this.prox = prox;
        registros.add(new Registro("52998224725", Situacao.REGULAR, 750));
        registros.add(new Registro("11144477735", Situacao.RESTRICAO, 480));
        registros.add(new Registro("12345678909", Situacao.NEGATIVADO, 300));
    }

    @Override
    public Resultado analisar(Cliente cliente, Imovel imovel) {
        if (cliente == null || imovel == null)
            throw new IllegalArgumentException("Cliente e imovel sao obrigatorios");
        List<Etapa> etapas = new ArrayList<>();
        String protocolo = String.format("COD-%04d", prox);
        prox++;
        String data = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        cliente.setStatus("Em analise");

        etapas.add(new Etapa("Validacao de CPF", true, "CPF valido"));

        Registro reg = buscar(cliente.getCpf());

        if (reg == null) {
            reg = new Registro(cliente.getCpf(), Situacao.REGULAR, 600);
        }

        String situacao = reg.getSituacao().getDescricao() + ", score " + reg.getScore();
        etapas.add(new Etapa("Analise cadastral", reg.aprovado(), situacao));
        if (!reg.aprovado())
            return terminar(cliente, protocolo, data, false, "Restricao cadastral (" + situacao + ")", etapas);

        double parcela = imovel.getPreco();
        double limite = cliente.getRenda() / 3;

        if (!imovel.isAluguel()) {
            Simulacao simulacao = new Simulacao(imovel.getPreco(), cliente.getRenda());
            parcela = simulacao.getParcela();
            limite = cliente.getRenda() * Simulacao.LIMITE;
        }
        etapas.add(new Etapa(imovel.isAluguel() ? "Valor do aluguel" : "Simulacao de credito", true,
                "Parcela mensal de " + moeda(parcela)));

        boolean cabe = parcela <= limite;
        etapas.add(new Etapa("Analise financeira", cabe, "Limite da renda: " + moeda(limite)));

        etapas.add(new Etapa("Consolidacao", cabe, cabe ? "Aprovado" : "Reprovado"));
        String motivo = cabe ? "Todos os criterios atendidos" : "Parcela acima do limite da renda";
        return terminar(cliente, protocolo, data, cabe, motivo, etapas);
    }

    private Registro buscar(String cpf) {
        for (Registro r : registros) {
            if (r.getCpf().equals(cpf))
                return r;
        }
        return null;
    }

    private Resultado terminar(Cliente cliente, String protocolo, String data, boolean aprovado, String motivo,
            List<Etapa> etapas) {
        cliente.setStatus(aprovado ? "Concluido" : "Em atendimento");
        return new Resultado(protocolo, data, aprovado, motivo, etapas);
    }

    private String moeda(double valor) {
        return String.format(Locale.forLanguageTag("pt-BR"), "R$ %,.2f", valor);
    }
}
