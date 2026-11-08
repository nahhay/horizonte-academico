package com.horizonte;

import java.util.ArrayList;
import java.util.List;

public class Resultado {
    private final String protocolo;
    private final String data;
    private final boolean aprovado;
    private final String motivo;
    private final List<Etapa> etapas;

    public Resultado(String protocolo, String data, boolean aprovado, String motivo, List<Etapa> etapas){
        this.protocolo = protocolo; this.data = data; this.aprovado = aprovado; this.motivo = motivo; this.etapas = new ArrayList<>(etapas);
    }

    public String getProtocolo(){return protocolo;}
    public String getData(){return data;}
    public boolean isAprovado(){return aprovado;}
    public String getMotivo(){return motivo;}
    public List<Etapa> getEtapas(){return new ArrayList<>(etapas);}
}
