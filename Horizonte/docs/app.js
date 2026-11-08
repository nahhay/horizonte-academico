const $ = (id) => document.getElementById(id);

const moeda = (n) =>
  Number(n).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const seguro = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const valor = (s) => {
  s = String(s ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "");

  if (!s) return NaN;

  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }

  return Number(s);
};

const texto = (s, nome) => {
  s = String(s ?? "").trim();

  if (s.length < 2) {
    throw Error("Informe " + nome + " válido.");
  }

  return s;
};

const positivo = (n, nome) => {
  n = Number(n);

  if (!Number.isFinite(n) || n <= 0) {
    throw Error(nome + " deve ser maior que zero.");
  }

  return n;
};

const inteiro = (n, nome) => {
  if (String(n).trim() === "") {
    throw Error("Informe a quantidade de " + nome.toLowerCase() + ".");
  }

  n = Number(n);

  if (!Number.isInteger(n) || n < 0) {
    throw Error(nome + " deve ser um número inteiro maior ou igual a zero.");
  }

  return n;
};

const limpar = (s) => String(s).replace(/\D/g, "");

const API = location.hostname === "localhost" || location.hostname === "127.0.0.1"
  ? "http://localhost:8080"
  : "https://SEU-SERVICO.onrender.com";

async function enviar(rota, dados) {
  let resposta;

  try {
    resposta = await fetch(API + rota, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
  } catch {
    throw Error("Servidor indisponível. Aguarde um instante e tente novamente.");
  }

  let retorno;
  try {
    retorno = await resposta.json();
  } catch {
    throw Error("Não foi possível obter a resposta do servidor.");
  }

  if (!resposta.ok) {
    throw Error(retorno.erro || "Não foi possível concluir a solicitação.");
  }

  return retorno;
}

const CHAVE = "horizonte-online-v1";

let banco = {
  imoveis: [],
  clientes: [],
  protocolo: 1,
};

try {
  const dados = JSON.parse(sessionStorage.getItem(CHAVE));

  if (dados && Array.isArray(dados.imoveis) && Array.isArray(dados.clientes)) {
    banco = dados;
  }
} catch (erro) {
  console.warn("Não foi possível ler os dados salvos.", erro);
}

if (!Number.isInteger(banco.protocolo) || banco.protocolo < 1) {
  banco.protocolo = 1;
}

function salvar() {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(banco));
  } catch (erro) {
    console.warn("Não foi possível salvar os dados.", erro);
  }
}

async function simular(preco, renda) {
  return enviar("/api/simular", { valor: preco, renda });
}

function card(i, remover = false) {
  return `
    <article class="im">
      <img src="img/foto-casa.jpg" alt="">

      <div class="corpo">
        <h3>${seguro(i.tipo)} · ${seguro(i.bairro)}</h3>
        <span class="mut">${seguro(i.endereco)}</span>

        <div class="preco">
          ${moeda(i.preco)}
          ${i.finalidade === "Alugar" ? '<small class="mut">/mês</small>' : ""}
        </div>

        <div class="meta">
          ${
            i.tipo === "Terreno"
              ? ""
              : `
            <span>
              <img src="img/cama.svg" alt="">
              ${i.quartos}
            </span>
            <span>
              <img src="img/banheiro.svg" alt="">
              ${i.banheiros}
            </span>
          `
          }

          <span>
            <img src="img/regua.svg" alt="">
            ${i.area} m²
          </span>
        </div>

        ${
          remover
            ? `<button class="btn sm rm" data-rm="${i.id}">
               Remover
             </button>`
            : `<span class="mut codigo">Cód. ${i.id}</span>`
        }
      </div>
    </article>
  `;
}

function iniciarSite() {
  let finalidade = "Comprar";

  function listar() {
    const bairro = $("f-bairro").value;

    const bairros = [...new Set(banco.imoveis.map((i) => i.bairro))].sort(
      (a, b) => a.localeCompare(b),
    );

    $("f-bairro").innerHTML =
      '<option value="">Todos os bairros</option>' +
      bairros.map((b) => `<option>${seguro(b)}</option>`).join("");

    $("f-bairro").value = bairros.includes(bairro) ? bairro : "";

    let lista = banco.imoveis.filter(
      (i) =>
        i.finalidade === finalidade &&
        (!$("f-bairro").value || i.bairro === $("f-bairro").value) &&
        (!$("f-tipo").value || i.tipo === $("f-tipo").value),
    );

    const ordem = $("f-ordem").value;

    if (ordem === "menor") {
      lista.sort((a, b) => a.preco - b.preco);
    }

    if (ordem === "maior") {
      lista.sort((a, b) => b.preco - a.preco);
    }

    if (ordem === "area") {
      lista.sort((a, b) => b.area - a.area);
    }

    $("total").textContent =
      lista.length +
      " imóvel" +
      (lista.length === 1 ? " encontrado" : "s encontrados");

    $("lista").innerHTML =
      lista.map((i) => card(i)).join("") ||
      '<p class="vazio">Nenhum imóvel com esses filtros.</p>';
  }

  document.querySelectorAll(".aba").forEach((aba) => {
    aba.onclick = () => {
      finalidade = aba.dataset.f;

      document.querySelectorAll(".aba").forEach((a) => {
        a.classList.toggle("on", a === aba);
      });

      listar();
    };
  });

  ["f-bairro", "f-tipo", "f-ordem"].forEach((id) => {
    $(id).onchange = listar;
  });

  $("simulador").onsubmit = async (e) => {
    e.preventDefault();
    $("resultado").innerHTML = '<p class="vazio larga">Consultando o servidor...</p>';

    try {
      const preco = valor($("s-imovel").value);
      const renda = valor($("s-renda").value);
      const s = await simular(preco, renda);

      const tile = (nome, v, classe = "") => `
        <div class="tile ${classe}">
          <small>${nome}</small>
          <b>${v}</b>
        </div>
      `;

      $("resultado").innerHTML =
        tile("Valor do imóvel", moeda(preco)) +
        tile("Entrada mínima (20%)", moeda(s.entrada)) +
        tile("Valor financiado", moeda(s.financiado)) +
        tile("Primeira parcela (PRICE)", moeda(s.parcela)) +
        tile("Prazo", s.prazo + " meses") +
        tile("Taxa", "0,8% a.m. (aprox. 10,03% a.a.)") +
        tile(
          "Comprometimento de renda (limite 30%)",
          s.cabe
            ? "Cabe na sua renda"
            : "Renda necessária: " + moeda(s.rendaNecessaria),
          (s.cabe ? "ok" : "no") + " larga",
        );
    } catch (erro) {
      $("resultado").innerHTML =
        `<p class="vazio larga">${seguro(erro.message)}</p>`;
    }
  };

  listar();
  $("simulador").requestSubmit();
}

function iniciar() {
  let imoveis = banco.imoveis;

  const nomes = {
    Novo: "Novo",
    "Em analise": "Em análise",
    "Em atendimento": "Em atendimento",
    Concluido: "Concluído",
  };

  const tag = (s) => `<span class="tag">${seguro(nomes[s] || s)}</span>`;

  const descricao = (id) => {
    const i = imoveis.find((x) => x.id === Number(id));

    return i ? seguro(i.tipo) + " - " + moeda(i.preco) : "-";
  };

  const aviso = (s) => {
    $("aviso").textContent = s;
    $("aviso").hidden = !s;
  };

  function tela() {
    const nome = location.hash.slice(1) || "geral";

    document.querySelectorAll(".view").forEach((v) => {
      v.classList.toggle("on", v.id === nome);
    });

    document.querySelectorAll('.lateral a[href^="#"]').forEach((a) => {
      a.classList.toggle("on", a.hash === "#" + nome);
    });
  }

  window.addEventListener("hashchange", tela);

  function atualizar() {
    imoveis = banco.imoveis;

    const clientes = banco.clientes;

    const contar = (s) => clientes.filter((c) => c.status === s).length;

    const grupos = [
      ["Interessados", clientes.length],
      ["Novos", contar("Novo")],
      ["Em análise", contar("Em analise")],
      ["Em atendimento", contar("Em atendimento")],
      ["Concluídos", contar("Concluido")],
      ["Imóveis", imoveis.length],
    ];

    $("kpis").innerHTML = grupos
      .map(
        ([nome, n]) => `
        <div class="kpi">
          <b>${n}</b>
          <span>${nome}</span>
        </div>
      `,
      )
      .join("");

    const linhas = clientes
      .slice(-5)
      .reverse()
      .map(
        (c) => `
        <tr>
          <td>${seguro(c.nome)}</td>
          <td>${descricao(c.imovel)}</td>
          <td>${tag(c.status)}</td>
          <td>
            <a class="btn sm"
               href="#analise"
               data-analisar="${c.cpf}"
               data-imovel="${c.imovel}">
              Analisar
            </a>
          </td>
        </tr>
      `,
      );

    $("recentes").innerHTML =
      linhas.join("") ||
      '<tr><td colspan="4" class="mut">Nenhum atendimento ainda.</td></tr>';

    const barras = [
      ["Novo", contar("Novo")],
      ["Em analise", contar("Em analise")],
      ["Em atendimento", contar("Em atendimento")],
      ["Concluido", contar("Concluido")],
    ];

    const maior = Math.max(1, ...barras.map((b) => b[1]));

    $("grafico").innerHTML = barras
      .map(
        ([nome, n]) => `
        <div>
          ${n}
          <i style="height:${(n / maior) * 120}px"></i>
          ${nomes[nome]}
        </div>
      `,
      )
      .join("");

    $("tab-clientes").innerHTML =
      clientes
        .map(
          (c) => `
        <tr>
          <td>${seguro(c.nome)}</td>
          <td>***.${c.cpf.slice(3, 6)}.${c.cpf.slice(6, 9)}-**</td>
          <td>${moeda(c.renda)}</td>
          <td>${descricao(c.imovel)}</td>
          <td>${tag(c.status)}</td>
          <td>
            <button class="btn sm" data-rmc="${c.cpf}">
              Remover
            </button>
          </td>
        </tr>
      `,
        )
        .join("") ||
      '<tr><td colspan="6" class="mut">Nenhum cliente cadastrado.</td></tr>';

    $("grade-imoveis").innerHTML =
      imoveis.map((i) => card(i, true)).join("") ||
      '<p class="vazio">Nenhum imóvel cadastrado.</p>';

    const escolhido = $("a-cliente").value;

    $("a-cliente").innerHTML =
      '<option value="">Selecione o cliente</option>' +
      clientes
        .map(
          (c) => `
          <option value="${c.cpf}">
            ${seguro(c.nome)}
          </option>
        `,
        )
        .join("");

    $("a-cliente").value = escolhido;
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rmc],[data-rm],[data-analisar]");

    if (!b) return;

    if (b.dataset.analisar) {
      $("a-cliente").value = b.dataset.analisar;
      $("a-cliente").onchange();
      return;
    }

    if (b.dataset.rmc) {
      banco.clientes = banco.clientes.filter((c) => c.cpf !== b.dataset.rmc);

      if ($("a-cpf").value === b.dataset.rmc) {
        $("a-cliente").value = "";
        $("a-cpf").value = "";
        $("a-codigo").value = "";

        $("etapas").innerHTML =
          '<p class="mut">Execute a análise para ver as etapas.</p>';

        $("res").innerHTML = '<p class="mut">Aguardando análise.</p>';
      }
    }

    if (b.dataset.rm) {
      const removido = Number(b.dataset.rm);

      banco.imoveis = banco.imoveis.filter((i) => i.id !== removido);

      const novos = new Map();

      banco.imoveis.forEach((imovel, indice) => {
        novos.set(imovel.id, indice + 1);
        imovel.id = indice + 1;
      });

      banco.clientes.forEach((cliente) => {
        cliente.imovel = novos.get(Number(cliente.imovel)) || 0;
      });

      $("a-cliente").value = "";
      $("a-cpf").value = "";
      $("a-codigo").value = "";

      $("etapas").innerHTML =
        '<p class="mut">Selecione um cliente e execute uma nova análise.</p>';

      $("res").innerHTML = '<p class="mut">Aguardando análise.</p>';
    }

    salvar();
    atualizar();
    aviso("");
  });

  const abrir = (id) => {
    const d = $(id);

    d.querySelector("form").reset();
    d.querySelector(".erro").textContent = "";
    d.showModal();
  };

  $("novo-cliente").onclick = () => {
    $("c-imovel").innerHTML =
      '<option value="0">Nenhum</option>' +
      imoveis
        .map(
          (i) => `
          <option value="${i.id}">
            #${i.id} ${seguro(i.tipo)} - ${seguro(i.bairro)}
          </option>
        `,
        )
        .join("");

    abrir("dlg-cliente");
  };

  const rotulo = () => {
    $("rotulo-preco").textContent =
      $("i-fin").value === "Alugar"
        ? "Valor do aluguel mensal (R$)"
        : "Preço de venda (R$)";
  };

  $("i-fin").onchange = rotulo;

  $("novo-imovel").onclick = () => {
    abrir("dlg-imovel");
    rotulo();
  };

  document.querySelectorAll("[data-fechar]").forEach((b) => {
    b.onclick = () => b.closest("dialog").close();
  });

  $("dlg-cliente").querySelector("form").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const nome = texto($("c-nome").value, "um nome");
      const cpf = limpar($("c-cpf").value);
      const renda = positivo(valor($("c-renda").value), "Renda");
      const imovel = inteiro($("c-imovel").value, "Imóvel");

      if (banco.clientes.some((c) => c.cpf === cpf)) {
        throw Error("CPF já cadastrado.");
      }

      if (imovel && !imoveis.some((i) => i.id === imovel)) {
        throw Error("Imóvel não encontrado.");
      }

      const cliente = await enviar("/api/clientes", { nome, cpf, renda, imovel });
      banco.clientes.push(cliente);

      salvar();
      atualizar();
      $("dlg-cliente").close();
      aviso("");
    } catch (erro) {
      $("dlg-cliente").querySelector(".erro").textContent = erro.message;
    }
  };

  $("dlg-imovel").querySelector("form").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const endereco = texto($("i-endereco").value, "um endereço");

      const bairro = texto($("i-bairro").value, "um bairro");

      const tipo = $("i-tipo").value;
      const finalidade = $("i-fin").value;

      if (
        !["Casa", "Apartamento", "Terreno"].includes(tipo) ||
        !["Comprar", "Alugar"].includes(finalidade)
      ) {
        throw Error("Tipo ou finalidade inválidos.");
      }

      const quartos = inteiro($("i-quartos").value, "Quartos");

      const banheiros = inteiro($("i-banheiros").value, "Banheiros");

      if (tipo !== "Terreno" && (quartos < 1 || banheiros < 1)) {
        throw Error(
          "Casa ou apartamento deve ter pelo menos 1 quarto e 1 banheiro.",
        );
      }

      const area = positivo(valor($("i-area").value), "Área");

      const preco = positivo(valor($("i-preco").value), "Preço");

      const imovel = await enviar("/api/imoveis", {
        id: imoveis.length + 1,
        endereco,
        bairro,
        tipo,
        finalidade,
        quartos,
        banheiros,
        area,
        preco,
      });
      banco.imoveis.push(imovel);

      salvar();
      atualizar();
      $("dlg-imovel").close();
      aviso("");
    } catch (erro) {
      $("dlg-imovel").querySelector(".erro").textContent = erro.message;
    }
  };

  $("a-cliente").onchange = () => {
    const cpf = $("a-cliente").value;

    const cliente = banco.clientes.find((c) => c.cpf === cpf);

    $("a-cpf").value = cpf;

    $("a-codigo").value = cliente && cliente.imovel ? cliente.imovel : "";

    $("etapas").innerHTML =
      '<p class="mut">Execute a análise para ver as etapas.</p>';

    $("res").innerHTML = '<p class="mut">Aguardando análise.</p>';

  };

  $("form-analise").onsubmit = async (e) => {
    e.preventDefault();

    try {
      const cpf = limpar($("a-cpf").value);
      const codigo = Number($("a-codigo").value);

      const c = banco.clientes.find((x) => x.cpf === cpf);

      const i = imoveis.find((x) => x.id === codigo);

      if (!c) {
        throw Error("Cliente não encontrado.");
      }

      if ($("a-cliente").value && $("a-cliente").value !== cpf) {
        throw Error("O CPF não corresponde ao cliente selecionado.");
      }

      if (!i) {
        throw Error("Imóvel não encontrado.");
      }

      $("etapas").innerHTML = '<p class="mut">Consultando o servidor...</p>';
      $("res").innerHTML = '<p class="mut">Aguardando resultado...</p>';

      const retorno = await enviar("/api/analisar", {
        cliente: { nome: c.nome, cpf: c.cpf, renda: c.renda, imovel: c.imovel },
        imovel: {
          id: i.id,
          endereco: i.endereco,
          bairro: i.bairro,
          tipo: i.tipo,
          finalidade: i.finalidade,
          quartos: i.quartos,
          banheiros: i.banheiros,
          area: i.area,
          preco: i.preco,
        },
        protocolo: banco.protocolo,
      });

      const resultado = retorno.resultado;
      const aprovado = resultado.aprovado;
      const motivo = resultado.motivo;
      const protocolo = resultado.protocolo;
      const etapas = resultado.etapas.map((e) => [e.nome, e.ok, e.detalhe]);

      c.imovel = codigo;
      c.status = retorno.status;
      banco.protocolo++;

      salvar();
      atualizar();

      $("etapas").innerHTML = etapas
        .map(
          ([nome, ok, detalhe], n) => `
          <div class="etapa">
            <span class="bola ${ok ? "" : "x"}">
              ${n + 1}
            </span>

            <div>
              <b>${seguro(nome)}</b>
              <small>${seguro(detalhe)}</small>
            </div>
          </div>
        `,
        )
        .join("");

      const linha = (a, b) => `
        <div class="dl">
          <span>${a}</span>
          <span>${seguro(b)}</span>
        </div>
      `;

      $("res").innerHTML =
        `
        <div class="veredito">
          <span class="bola ${aprovado ? "" : "x"}">
            ${aprovado ? "✓" : "✕"}
          </span>

          ${aprovado ? "APTO A PROSSEGUIR" : "NÃO APTO"}
        </div>
      ` +
        linha("Protocolo", protocolo) +
        linha("Data", resultado.data) +
        linha("Motivo", motivo) +
        linha("Imóvel", "#" + i.id + " " + i.tipo + " · " + moeda(i.preco));

      aviso("");
    } catch (erro) {
      $("etapas").innerHTML = '<p class="mut">Sem etapas.</p>';

      $("res").innerHTML =
        '<p class="erro">Erro: ' + seguro(erro.message) + "</p>";
    }
  };

  tela();
  atualizar();
}

if (document.body.dataset.pagina === "site") {
  iniciarSite();
} else if (document.body.dataset.pagina === "sistema") {
  iniciar();
}
