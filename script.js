// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 20,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável em memória para o PIN durante a sessão
let pinSessao = "";

// Lista atual de disciplinas e dados em memória
let dadosDisciplinasAtuais = [];

// Dados brutos de fallback (originais do projeto)
const dadosBoletimPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Função para converter/normalizar notas antigas para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === "string") {
        valor = valor.replace(",", ".");
    }

    let num = Number(valor);

    if (isNaN(num)) {
        return null;
    }

    if (num >= 0 && num <= 10) {
        return num;
    }

    if (num > 10 && num <= 100) {
        return num / 10;
    }

    return null;
}

// Função para formatar exibição da nota no HTML
function formatarExibicaoNota(nota) {
    if (nota === null || nota === undefined) return "—";
    return nota.toFixed(1).replace(".", ",");
}

// Elementos da interface
const inputPin = document.getElementById("pin-input");
const btnEntrar = document.getElementById("btn-entrar");
const msgLogin = document.getElementById("login-mensagem");
const areaLogin = document.getElementById("area-login");
const conteudoBoletim = document.getElementById("conteudo-boletim");

const btnAlterarDados = document.getElementById("btn-alterar-dados");
const areaEdicao = document.getElementById("area-edicao");
const formEdicaoGrid = document.getElementById("form-edicao-grid");
const btnSalvarDados = document.getElementById("btn-salvar-dados");
const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
const msgEdicao = document.getElementById("edicao-mensagem");
const msgGlobal = document.getElementById("mensagem-global");

// Evento do botão Entrar
btnEntrar.addEventListener("click", realizarLogin);
inputPin.addEventListener("keyup", (e) => {
    if (e.key === "Enter") realizarLogin();
});

async function realizarLogin() {
    const pinDigitado = inputPin.value.trim();

    if (!pinDigitado) {
        exibirMensagem(msgLogin, "Por favor, digite o PIN.", "erro");
        return;
    }

    exibirMensagem(msgLogin, "Conectando...", "info");

    try {
        const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinDigitado
            })
        });

        if (response.status === 401) {
            exibirMensagem(msgLogin, "Turma, chamada ou PIN inválidos.", "erro");
            return;
        }

        if (response.status === 429) {
            exibirMensagem(msgLogin, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
            return;
        }

        if (!response.ok) {
            exibirMensagem(msgLogin, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
            return;
        }

        const data = await response.json();

        // Guarda o PIN em memória e limpa o campo
        pinSessao = pinDigitado;
        inputPin.value = "";

        // Oculta login e exibe o boletim
        areaLogin.style.display = "none";
        conteudoBoletim.style.display = "block";

        // Processa dados recebidos ou usa os locais
        if (data && data.dados && Array.isArray(data.dados.disciplinas) && data.dados.disciplinas.length > 0) {
            dadosDisciplinasAtuais = data.dados.disciplinas;
        } else {
            dadosDisciplinasAtuais = JSON.parse(JSON.stringify(dadosBoletimPadrao));
        }

        renderizarBoletim();

    } catch (erro) {
        exibirMensagem(msgLogin, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
    }
}

// Renderização do boletim na tela
function renderizarBoletim() {
    const corpoTabela = document.getElementById("tabela-corpo");
    corpoTabela.innerHTML = "";

    let somaMediasValidas = 0;
    let qtdDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let qtdBomDesempenho = 0;
    let qtdPrecisaAtencao = 0;

    dadosDisciplinasAtuais.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const notasValidas = [n1, n2, n3].filter(n => n !== null);
        let media = null;
        if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
            media = soma / notasValidas.length;
            somaMediasValidas += media;
            qtdDisciplinasComMedia++;
        }

        let faltasDisciplina = 0;
        if (Array.isArray(item.faltas)) {
            faltasDisciplina = item.faltas.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
        } else if (typeof item.faltas === "number") {
            faltasDisciplina = item.faltas;
        }
        totalFaltasGeral += faltasDisciplina;

        let situacaoTexto = "";
        let situacaoClasse = "";

        if (media === null) {
            situacaoTexto = "Nota ainda não disponível";
            situacaoClasse = "situacao-indisponivel";
        } else if (media >= 6.0) {
            situacaoTexto = "Bom desempenho";
            situacaoClasse = "situacao-bom";
            qtdBomDesempenho++;
        } else {
            situacaoTexto = "Atenção";
            situacaoClasse = "situacao-atencao";
            qtdPrecisaAtencao++;
        }

        const tr = document.createElement("tr");

        const tdNome = document.createElement("td");
        const strongNome = document.createElement("strong");
        strongNome.textContent = item.disciplina;
        tdNome.appendChild(strongNome);

        const tdN1 = document.createElement("td");
        tdN1.textContent = formatarExibicaoNota(n1);

        const tdN2 = document.createElement("td");
        tdN2.textContent = formatarExibicaoNota(n2);

        const tdN3 = document.createElement("td");
        tdN3.textContent = formatarExibicaoNota(n3);

        const tdMedia = document.createElement("td");
        const strongMedia = document.createElement("strong");
        strongMedia.textContent = formatarExibicaoNota(media);
        tdMedia.appendChild(strongMedia);

        const tdFaltas = document.createElement("td");
        tdFaltas.textContent = faltasDisciplina;

        const tdSit = document.createElement("td");
        tdSit.className = situacaoClasse;
        tdSit.textContent = situacaoTexto;

        tr.appendChild(tdNome);
        tr.appendChild(tdN1);
        tr.appendChild(tdN2);
        tr.appendChild(tdN3);
        tr.appendChild(tdMedia);
        tr.appendChild(tdFaltas);
        tr.appendChild(tdSit);

        corpoTabela.appendChild(tr);
    });

    const mediaGeralFinal = qtdDisciplinasComMedia > 0 
        ? (somaMediasValidas / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") 
        : "—";

    document.getElementById("media-geral").textContent = mediaGeralFinal;
    document.getElementById("total-faltas").textContent = totalFaltasGeral;
    document.getElementById("bom-desempenho").textContent = qtdBomDesempenho;
    document.getElementById("precisa-atencao").textContent = qtdPrecisaAtencao;
}

// Botões da Edição
btnAlterarDados.addEventListener("click", abrirEdicao);
btnCancelarEdicao.addEventListener("click", () => {
    areaEdicao.style.display = "none";
    msgEdicao.textContent = "";
});

function abrirEdicao() {
    formEdicaoGrid.innerHTML = "";
    msgEdicao.textContent = "";

    dadosDisciplinasAtuais.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "edicao-card";

        const titulo = document.createElement("h3");
        titulo.textContent = item.disciplina;
        card.appendChild(titulo);

        const gridInputs = document.createElement("div");
        gridInputs.className = "edicao-inputs-grid";

        // Trata faltas existentes (array ou número)
        let f1 = "", f2 = "", f3 = "";
        if (Array.isArray(item.faltas)) {
            f1 = item.faltas[0] !== undefined ? item.faltas[0] : "";
            f2 = item.faltas[1] !== undefined ? item.faltas[1] : "";
            f3 = item.faltas[2] !== undefined ? item.faltas[2] : "";
        }

        // Formata notas para exibição simples no input
        const prepararNotaInput = (val) => {
            const norm = normalizarNota(val);
            return norm === null ? "" : norm;
        };

        gridInputs.appendChild(criarCampoInput(`tri1_${index}`, "Nota 1º Tri", prepararNotaInput(item.tri1)));
        gridInputs.appendChild(criarCampoInput(`tri2_${index}`, "Nota 2º Tri", prepararNotaInput(item.tri2)));
        gridInputs.appendChild(criarCampoInput(`tri3_${index}`, "Nota 3º Tri", prepararNotaInput(item.tri3)));

        gridInputs.appendChild(criarCampoInput(`f1_${index}`, "Faltas 1º Tri", f1));
        gridInputs.appendChild(criarCampoInput(`f2_${index}`, "Faltas 2º Tri", f2));
        gridInputs.appendChild(criarCampoInput(`f3_${index}`, "Faltas 3º Tri", f3));

        card.appendChild(gridInputs);
        formEdicaoGrid.appendChild(card);
    });

    areaEdicao.style.display = "block";
    areaEdicao.scrollIntoView({ behavior: 'smooth' });
}

function criarCampoInput(id, labelTexto, valor) {
    const grupo = document.createElement("div");
    grupo.className = "campo-grupo";

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = labelTexto;

    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.value = valor !== null && valor !== undefined ? valor : "";

    grupo.appendChild(label);
    grupo.appendChild(input);
    return grupo;
}

// Validadores estritos para digitação do aluno
function validarNotaDigitada(str) {
    if (str === null || str === undefined) return { valida: true, valor: null };
    const texto = String(str).trim();
    if (texto === "") return { valida: true, valor: null };

    // Não aceita vírgulas ou pontos múltiplos, nem formatos como 75
    const textoFormatado = texto.replace(",", ".");
    const num = Number(textoFormatado);

    if (isNaN(num)) return { valida: false, valor: null };
    if (num < 0 || num > 10) return { valida: false, valor: null };

    return { valida: true, valor: num };
}

function validarFaltaDigitada(str) {
    if (str === null || str === undefined) return { valida: false, valor: null };
    const texto = String(str).trim();
    if (texto === "") return { valida: false, valor: null };

    // Deve ser número inteiro zero ou positivo
    if (!/^\d+$/.test(texto)) return { valida: false, valor: null };

    const num = Number(texto);
    if (num < 0) return { valida: false, valor: null };

    return { valida: true, valor: num };
}

// Evento de Salvar Alterações
btnSalvarDados.addEventListener("click", async () => {
    msgEdicao.textContent = "";
    let houverErro = false;

    // Limpa destaque de erros anteriores
    document.querySelectorAll(".campo-invalido").forEach(el => el.classList.remove("campo-invalido"));

    const novasDisciplinas = [];

    for (let i = 0; i < dadosDisciplinasAtuais.length; i++) {
        const itemOriginal = dadosDisciplinasAtuais[i];

        const inpN1 = document.getElementById(`tri1_${i}`);
        const inpN2 = document.getElementById(`tri2_${i}`);
        const inpN3 = document.getElementById(`tri3_${i}`);

        const inpF1 = document.getElementById(`f1_${i}`);
        const inpF2 = document.getElementById(`f2_${i}`);
        const inpF3 = document.getElementById(`f3_${i}`);

        const resN1 = validarNotaDigitada(inpN1.value);
        if (!resN1.valida) { inpN1.classList.add("campo-invalido"); houverErro = true; }

        const resN2 = validarNotaDigitada(inpN2.value);
        if (!resN2.valida) { inpN2.classList.add("campo-invalido"); houverErro = true; }

        const resN3 = validarNotaDigitada(inpN3.value);
        if (!resN3.valida) { inpN3.classList.add("campo-invalido"); houverErro = true; }

        const resF1 = validarFaltaDigitada(inpF1.value);
        if (!resF1.valida) { inpF1.classList.add("campo-invalido"); houverErro = true; }

        const resF2 = validarFaltaDigitada(inpF2.value);
        if (!resF2.valida) { inpF2.classList.add("campo-invalido"); houverErro = true; }

        const resF3 = validarFaltaDigitada(inpF3.value);
        if (!resF3.valida) { inpF3.classList.add("campo-invalido"); houverErro = true; }

        if (!houverErro) {
            novasDisciplinas.push({
                disciplina: itemOriginal.disciplina,
                tri1: resN1.valor,
                tri2: resN2.valor,
                tri3: resN3.valor,
                faltas: [resF1.valor, resF2.valor, resF3.valor]
            });
        }
    }

    if (houverErro) {
        exibirMensagem(msgEdicao, "Verifique os campos destacados em vermelho. Notas devem ser de 0 a 10 e faltas devem ser números inteiros.", "erro");
        return;
    }

    exibirMensagem(msgEdicao, "Salvando...", "info");

    try {
        const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinSessao,
                dados: {
                    disciplinas: novasDisciplinas
                }
            })
        });

        if (!response.ok) {
            exibirMensagem(msgEdicao, "Não foi possível salvar os dados. Tente novamente.", "erro");
            return;
        }

        // Sucesso
        dadosDisciplinasAtuais = novasDisciplinas;
        renderizarBoletim();

        areaEdicao.style.display = "none";
        exibirMensagem(msgGlobal, "Dados salvos com sucesso.", "sucesso");
        setTimeout(() => { msgGlobal.textContent = ""; }, 4000);

    } catch (erro) {
        exibirMensagem(msgEdicao, "Não foi possível salvar os dados. Tente novamente.", "erro");
    }
});

// Auxiliar para mensagens de status
function exibirMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `mensagem-status mensagem-${tipo}`;
}