package com.horizonte;

import java.util.ArrayList;
import java.util.List;

public class Repositorio<T>{
    private List<T> itens = new ArrayList<>();
    public void adicionar(T item){itens.add(item);}
    public void remover(T item){itens.remove(item);}

    public List<T> listar() {return new ArrayList<>(itens);}
}
