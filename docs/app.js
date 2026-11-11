const API = "https://horizonte-academico.onrender.com";
const $ = (id) => document.getElementById(id);
const moeda = (n) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const seguro = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const valor = (s) => {
  s = String(s ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "");
  if (!s) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return Number(s);
};
const limpar = (s) => String(s ?? "").replace(/\D/g, "");
let banco = { imoveis: [], clientes: [] };

async function pedido(caminho, metodo = "GET", dados) {
  let resposta;
  try {
    resposta = await fetch(API + caminho, {
      method: metodo,
      headers:
        dados === undefined ? {} : { "Content-Type": "application/json" },
      body: dados === undefined ? undefined : JSON.stringify(dados),
    });
  } catch (_) {
    throw Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  const tipo = resposta.headers.get("content-type") || "";
  const corpo = tipo.includes("application/json")
    ? await resposta.json()
    : null;
  if (!resposta.ok)
    throw Error(corpo?.erro || "Erro na API (" + resposta.status + ").");
  return corpo;
}
async function carregar() {
  banco = await pedido("/api/dados");
}
function card(i, remover = false) {
  return `<article class="im"><img src="img/foto-casa.jpg" alt=""><div class="corpo">
    <h3>${seguro(i.tipo)} · ${seguro(i.bairro)}</h3><span class="mut">${seguro(i.endereco)}</span>
    <div class="preco">${moeda(i.preco)}${i.finalidade === "Alugar" ? '<small class="mut">/mês</small>' : ""}</div>
    <div class="meta">${i.tipo === "Terreno" ? "" : `<span><img src="img/cama.svg" alt="">${i.quartos}</span><span><img src="img/banheiro.svg" alt="">${i.banheiros}</span>`}
    <span><img src="img/regua.svg" alt="">${i.area} m²</span></div>
    ${remover ? `<button class="btn sm rm" data-rm="${i.id}">Remover</button>` : `<span class="mut codigo">Cód. ${i.id}</span>`}</div></article>`;
}

async function iniciarSite() {
  let finalidade = "Comprar";
  function listar() {
    const bairro = $("f-bairro").value;
    const bairros = [...new Set(banco.imoveis.map((i) => i.bairro))].sort(
      (a, b) => a.localeCompare(b),
    );
    $("f-bairro").innerHTML =
      '<option value="">Todos os bairros</option>' +
      bairros
        .map((b) => `<option value="${seguro(b)}">${seguro(b)}</option>`)
        .join("");
    $("f-bairro").value = bairros.includes(bairro) ? bairro : "";
    let lista = banco.imoveis.filter(
      (i) =>
        i.finalidade === finalidade &&
        (!$("f-bairro").value || i.bairro === $("f-bairro").value) &&
        (!$("f-tipo").value || i.tipo === $("f-tipo").value),
    );
    const ordem = $("f-ordem").value;
    if (ordem === "menor") lista.sort((a, b) => a.preco - b.preco);
    if (ordem === "maior") lista.sort((a, b) => b.preco - a.preco);
    if (ordem === "area") lista.sort((a, b) => b.area - a.area);
    $("total").textContent =
      lista.length +
      " imóvel" +
      (lista.length === 1 ? " encontrado" : "s encontrados");
    $("lista").innerHTML =
      lista.map((i) => card(i)).join("") ||
      '<p class="vazio">Nenhum imóvel com esses filtros.</p>';
  }
  document.querySelectorAll(".aba").forEach(
    (aba) =>
      (aba.onclick = () => {
        finalidade = aba.dataset.f;
        document
          .querySelectorAll(".aba")
          .forEach((a) => a.classList.toggle("on", a === aba));
        listar();
      }),
  );
  ["f-bairro", "f-tipo", "f-ordem"].forEach((id) => ($(id).onchange = listar));
  $("simulador").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const preco = valor($("s-imovel").value),
        renda = valor($("s-renda").value);
      const s = await pedido("/api/simular", "POST", { valor: preco, renda });
      const tile = (nome, v, classe = "") =>
        `<div class="tile ${classe}"><small>${nome}</small><b>${v}</b></div>`;
      $("resultado").innerHTML =
        tile("Valor do imóvel", moeda(preco)) +
        tile("Entrada (" + s.entradaPercentual + "%)", moeda(s.entrada)) +
        tile("Valor financiado", moeda(s.financiado)) +
        tile("Primeira parcela (PRICE)", moeda(s.parcela)) +
        tile("Prazo", s.prazo + " meses") +
        tile(
          "Taxa",
          s.taxaMensal.toLocaleString("pt-BR") +
            "% a.m. (" +
            s.taxaAnual.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) +
            "% a.a.)",
        ) +
        tile(
          "Comprometimento de renda (limite " + s.limitePercentual + "%)",
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
  try {
    banco.imoveis = await pedido("/api/imoveis");
    listar();
    $("simulador").requestSubmit();
  } catch (erro) {
    $("lista").innerHTML = `<p class="vazio">${seguro(erro.message)}</p>`;
    $("resultado").innerHTML =
      `<p class="vazio larga">${seguro(erro.message)}</p>`;
  }
}

async function iniciar() {
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
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.toggle("on", v.id === nome));
    document
      .querySelectorAll('.lateral a[href^="#"]')
      .forEach((a) => a.classList.toggle("on", a.hash === "#" + nome));
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
        ([nome, n]) => `<div class="kpi"><b>${n}</b><span>${nome}</span></div>`,
      )
      .join("");
    const linhas = clientes
      .slice(-5)
      .reverse()
      .map(
        (c) =>
          `<tr><td>${seguro(c.nome)}</td><td>${descricao(c.imovel)}</td><td>${tag(c.status)}</td><td><a class="btn sm" href="#analise" data-analisar="${seguro(c.cpf)}" data-imovel="${c.imovel}">Analisar</a></td></tr>`,
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
        ([nome, n]) =>
          `<div>${n}<i style="height:${(n / maior) * 120}px"></i>${nomes[nome]}</div>`,
      )
      .join("");
    $("tab-clientes").innerHTML =
      clientes
        .map(
          (c) =>
            `<tr><td>${seguro(c.nome)}</td><td>***.${seguro(c.cpf.slice(3, 6))}.${seguro(c.cpf.slice(6, 9))}-**</td><td>${moeda(c.renda)}</td><td>${descricao(c.imovel)}</td><td>${tag(c.status)}</td><td><button class="btn sm" data-rmc="${seguro(c.cpf)}">Remover</button></td></tr>`,
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
          (c) => `<option value="${seguro(c.cpf)}">${seguro(c.nome)}</option>`,
        )
        .join("");
    $("a-cliente").value = escolhido;
  }
  function limparAnalise() {
    $("a-cliente").value = "";
    $("a-cpf").value = "";
    $("a-codigo").value = "";
    $("etapas").innerHTML =
      '<p class="mut">Selecione um cliente e execute uma nova análise.</p>';
    $("res").innerHTML = '<p class="mut">Aguardando análise.</p>';
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-rmc],[data-rm],[data-analisar]");
    if (!b) return;
    if (b.dataset.analisar) {
      $("a-cliente").value = b.dataset.analisar;
      $("a-cpf").value = b.dataset.analisar;
      $("a-codigo").value = Number(b.dataset.imovel) || "";
      return;
    }
    b.disabled = true;
    try {
      if (b.dataset.rmc)
        await pedido(
          "/api/clientes/" + encodeURIComponent(b.dataset.rmc),
          "DELETE",
        );
      if (b.dataset.rm)
        await pedido(
          "/api/imoveis/" + encodeURIComponent(b.dataset.rm),
          "DELETE",
        );
      await carregar();
      atualizar();
      limparAnalise();
      aviso("");
    } catch (erro) {
      aviso("Erro: " + erro.message);
    } finally {
      b.disabled = false;
    }
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
          (i) =>
            `<option value="${i.id}">#${i.id} ${seguro(i.tipo)} - ${seguro(i.bairro)}</option>`,
        )
        .join("");
    abrir("dlg-cliente");
  };
  const rotulo = () =>
    ($("rotulo-preco").textContent =
      $("i-fin").value === "Alugar"
        ? "Valor do aluguel mensal (R$)"
        : "Preço de venda (R$)");
  $("i-fin").onchange = rotulo;
  $("i-tipo").onchange = () => {
    const minimo = $("i-tipo").value === "Terreno" ? 0 : 1;
    for (const id of ["i-quartos", "i-banheiros"]) {
      $(id).min = minimo;
      if (Number($(id).value) < minimo) $(id).value = minimo;
    }
  };
  $("novo-imovel").onclick = () => {
    abrir("dlg-imovel");
    rotulo();
    $("i-tipo").onchange();
  };
  document
    .querySelectorAll("[data-fechar]")
    .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  $("dlg-cliente").querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await pedido("/api/clientes", "POST", {
        nome: $("c-nome").value.trim(),
        cpf: $("c-cpf").value.trim(),
        renda: valor($("c-renda").value),
        imovel: Number($("c-imovel").value),
      });
      await carregar();
      atualizar();
      $("dlg-cliente").close();
      aviso("");
    } catch (erro) {
      form.querySelector(".erro").textContent = erro.message;
    }
  };
  $("dlg-imovel").querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await pedido("/api/imoveis", "POST", {
        endereco: $("i-endereco").value.trim(),
        bairro: $("i-bairro").value.trim(),
        tipo: $("i-tipo").value,
        finalidade: $("i-fin").value,
        quartos: Number($("i-quartos").value),
        banheiros: Number($("i-banheiros").value),
        area: valor($("i-area").value),
        preco: valor($("i-preco").value),
      });
      await carregar();
      atualizar();
      $("dlg-imovel").close();
      aviso("");
    } catch (erro) {
      form.querySelector(".erro").textContent = erro.message;
    }
  };
  $("a-cliente").onchange = () => {
    const cpf = $("a-cliente").value;
    const c = banco.clientes.find((x) => x.cpf === cpf);
    $("a-cpf").value = cpf;
    $("a-codigo").value = c?.imovel || "";
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
      if (!c) throw Error("Cliente não encontrado.");
      if ($("a-cliente").value && $("a-cliente").value !== cpf)
        throw Error("O CPF não corresponde ao cliente selecionado.");
      if (!i) throw Error("Imóvel não encontrado.");
      const dados = await pedido("/api/analisar", "POST", { cpf, codigo });
      const r = dados.resultado;
      await carregar();
      atualizar();
      $("etapas").innerHTML = (r.etapas || [])
        .map(
          (et, n) =>
            `<div class="etapa"><span class="bola ${et.ok ? "" : "x"}">${n + 1}</span><div><b>${seguro(et.nome)}</b><small>${seguro(et.detalhe)}</small></div></div>`,
        )
        .join("");
      const linha = (a, b) =>
        `<div class="dl"><span>${a}</span><span>${seguro(b)}</span></div>`;
      $("res").innerHTML =
        `<div class="veredito"><span class="bola ${r.aprovado ? "" : "x"}">${r.aprovado ? "✓" : "✕"}</span> ${r.aprovado ? "APTO A PROSSEGUIR" : "NÃO APTO"}</div>` +
        linha("Protocolo", r.protocolo) +
        linha("Data", r.data) +
        linha("Motivo", r.motivo) +
        linha("Imóvel", "#" + i.id + " " + i.tipo + " · " + moeda(i.preco));
      aviso("");
    } catch (erro) {
      $("etapas").innerHTML = '<p class="mut">Sem etapas.</p>';
      $("res").innerHTML =
        '<p class="erro">Erro: ' + seguro(erro.message) + "</p>";
    }
  };
  tela();
  try {
    await carregar();
    atualizar();
  } catch (erro) {
    aviso("Erro ao carregar os cadastros: " + erro.message);
  }
}
if (document.body.dataset.pagina === "site") iniciarSite();
else if (document.body.dataset.pagina === "sistema") iniciar();
