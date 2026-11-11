
package com.horizonte;

import java.net.URI;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(originPatterns = { "https://*.github.io", "http://localhost:*", "http://127.0.0.1:*" })
public class Api {
    public record DadosImovel(String endereco, String bairro, String tipo, String finalidade,
            int quartos, int banheiros, double area, double preco) {
    }

    public record DadosCliente(String nome, String cpf, double renda, int imovel) {
    }

    public record DadosAnalise(String cpf, int codigo) {
    }

    private final Repositorio<Imovel> imoveis = new Repositorio<>();
    private final Repositorio<Cliente> clientes = new Repositorio<>();
    private final Corretor corretor = new Corretor();

    @GetMapping("/")
    public ResponseEntity<Void> inicio() {
        return ResponseEntity.status(302)
                .location(URI.create("https://nahhay.github.io/horizonte-academico/index.html"))
                .build();
    }

    @GetMapping("/api/saude")
    public Map<String, String> saude() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/imoveis")
    public synchronized List<Imovel> listarImoveis() {
        return imoveis.listar();
    }

    @GetMapping("/api/dados")
    public synchronized Map<String, Object> dados() {
        return Map.of("imoveis", imoveis.listar(),
                "clientes", clientes.listar());
    }

    private Imovel imovel(DadosImovel dados, int id) {
        if (dados == null)
            throw new IllegalArgumentException("Informe o imovel");
        return new Imovel(id, dados.endereco(), dados.bairro(), dados.tipo(),
                dados.quartos(), dados.banheiros(), dados.area(), dados.preco(), dados.finalidade());
    }

    private Cliente cliente(DadosCliente dados) {
        if (dados == null)
            throw new IllegalArgumentException("Informe o cliente");
        return new Cliente(dados.nome(), dados.cpf(), dados.renda(), dados.imovel());
    }

    @PostMapping("/api/imoveis")
    public synchronized Imovel cadastrarImovel(@RequestBody DadosImovel dados) {
        Imovel novo = imovel(dados, imoveis.listar().size() + 1);
        imoveis.adicionar(novo);
        return novo;
    }

    @DeleteMapping("/api/imoveis/{id}")
    public synchronized Map<String, String> removerImovel(@PathVariable int id) {
        Imovel removido = imoveis.listar().stream()
                .filter(i -> i.getId() == id).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Imovel nao encontrado"));
        imoveis.remover(removido);

        List<Imovel> ordem = new ArrayList<>();
        for (Imovel i : imoveis.listar()) {
            ordem.add(new Imovel(ordem.size() + 1, i.getEndereco(), i.getBairro(),
                    i.getTipo(), i.getQuartos(), i.getBanheiros(), i.getArea(),
                    i.getPreco(), i.getFinalidade()));
        }
        imoveis.limpar();
        for (Imovel i : ordem)
            imoveis.adicionar(i);

        List<Cliente> novos = new ArrayList<>();
        for (Cliente c : clientes.listar()) {
            int codigo = c.getImovel();
            int atual = codigo == id ? 0 : codigo > id ? codigo - 1 : codigo;
            Cliente copia = new Cliente(c.getNome(), c.getCpf(), c.getRenda(), atual);
            copia.setStatus(c.getStatus());
            novos.add(copia);
        }
        clientes.limpar();
        for (Cliente c : novos)
            clientes.adicionar(c);

        return Map.of("status", "ok");
    }

    @PostMapping("/api/clientes")
    public synchronized Cliente cadastrarCliente(@RequestBody DadosCliente dados) {
        Cliente novo = cliente(dados);
        if (clientes.listar().stream().anyMatch(c -> c.getCpf().equals(novo.getCpf())))
            throw new IllegalArgumentException("CPF ja cadastrado");
        if (novo.getImovel() != 0 && imoveis.listar().stream()
                .noneMatch(i -> i.getId() == novo.getImovel()))
            throw new IllegalArgumentException("Imovel nao encontrado");
        clientes.adicionar(novo);
        return novo;
    }

    @DeleteMapping("/api/clientes/{cpf}")
    public synchronized Map<String, String> removerCliente(@PathVariable String cpf) {
        String numero = cpf.replaceAll("\\D", "");
        Cliente encontrado = clientes.listar().stream()
                .filter(c -> c.getCpf().equals(numero)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado"));
        clientes.remover(encontrado);
        return Map.of("status", "ok");
    }

    @PostMapping("/api/simular")
    public Map<String, Object> simular(@RequestBody Map<String, Double> dados) {
        if (dados == null || dados.get("valor") == null || dados.get("renda") == null)
            throw new IllegalArgumentException("Informe o valor do imovel e a renda");
        Simulacao s = new Simulacao(dados.get("valor"), dados.get("renda"));
        double rendaMinima = BigDecimal.valueOf(s.getRendaNecessaria())
                .setScale(2, RoundingMode.CEILING).doubleValue();
        return Map.of("entrada", s.getEntrada(), "financiado", s.getFinanciado(),
                "parcela", s.getParcela(), "prazo", Simulacao.PRAZO,
                "cabe", s.isCabe(), "rendaNecessaria", rendaMinima,
                "entradaPercentual", Simulacao.ENTRADA * 100,
                "limitePercentual", Simulacao.LIMITE * 100,
                "taxaMensal", Simulacao.JUROS * 100,
                "taxaAnual", s.getTaxaAnual());
    }

    @PostMapping("/api/analisar")
    public synchronized Map<String, Object> analisar(@RequestBody DadosAnalise dados) {
        if (dados == null || dados.cpf() == null)
            throw new IllegalArgumentException("Informe o cliente e o imovel");
        String cpf = dados.cpf().replaceAll("\\D", "");
        Cliente c = clientes.listar().stream()
                .filter(x -> x.getCpf().equals(cpf)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado"));
        Imovel i = imoveis.listar().stream()
                .filter(x -> x.getId() == dados.codigo()).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Imovel nao encontrado"));
        Resultado resultado = corretor.analisar(c, i);
        return Map.of("resultado", resultado, "status", c.getStatus());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalido(IllegalArgumentException erro) {
        return ResponseEntity.badRequest().body(Map.of("erro", erro.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> formato() {
        return ResponseEntity.badRequest().body(Map.of("erro", "Dados invalidos ou incompletos"));
    }
}
