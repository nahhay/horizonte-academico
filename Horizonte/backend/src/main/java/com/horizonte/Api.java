package com.horizonte;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@CrossOrigin(originPatterns = {"https://*.github.io", "http://localhost:*", "http://127.0.0.1:*"})
public class Api {
    public record DadosImovel(int id, String endereco, String bairro, String tipo, String finalidade,
                              int quartos, int banheiros, double area, double preco) {}

    public record DadosCliente(String nome, String cpf, double renda, int imovel) {}

    public record DadosAnalise(DadosCliente cliente, DadosImovel imovel, int protocolo) {}

    @GetMapping("/api/saude")
    public Map<String, String> saude() {
        return Map.of("status", "ok");
    }

    private Imovel imovel(DadosImovel dados) {
        if (dados == null) throw new IllegalArgumentException("Informe o imovel");
        return new Imovel(dados.id(), dados.endereco(), dados.bairro(), dados.tipo(),
                dados.quartos(), dados.banheiros(), dados.area(), dados.preco(), dados.finalidade());
    }

    private Cliente cliente(DadosCliente dados) {
        if (dados == null) throw new IllegalArgumentException("Informe o cliente");
        return new Cliente(dados.nome(), dados.cpf(), dados.renda(), dados.imovel());
    }

    @PostMapping("/api/imoveis")
    public Imovel cadastrarImovel(@RequestBody DadosImovel dados) {
        return imovel(dados);
    }

    @PostMapping("/api/clientes")
    public Cliente cadastrarCliente(@RequestBody DadosCliente dados) {
        return cliente(dados);
    }

    @PostMapping("/api/simular")
    public Simulacao simular(@RequestBody Map<String, Double> dados) {
        if (dados == null || dados.get("valor") == null || dados.get("renda") == null)
            throw new IllegalArgumentException("Informe o valor do imovel e a renda");
        return new Simulacao(dados.get("valor"), dados.get("renda"));
    }

    @PostMapping("/api/analisar")
    public Map<String, Object> analisar(@RequestBody DadosAnalise dados) {
        if (dados == null) throw new IllegalArgumentException("Informe os dados da analise");
        Cliente cliente = cliente(dados.cliente());
        Imovel imovel = imovel(dados.imovel());
        Resultado resultado = new Corretor(dados.protocolo()).analisar(cliente, imovel);
        return Map.of("resultado", resultado, "status", cliente.getStatus());
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
