// Dados brutos padronizados do 8º Ano
const dadosBoletim = [
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

// Função para converter/normalizar notas para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    // Converte vírgula para ponto se for string
    if (typeof valor === "string") {
        valor = valor.replace(",", ".");
    }

    let num = Number(valor);

    // Se não for um número válido
    if (isNaN(num)) {
        return null;
    }

    // Se estiver entre 0 e 10
    if (num >= 0 && num <= 10) {
        return num;
    }

    // Se for entre 10 e 100 (ex: 82 vira 8.2)
    if (num > 10 && num <= 100) {
        return num / 10;
    }

    // Valores fora das regras
    return null;
}

// Função para formatar exibição da nota no HTML
function formatarExibicaoNota(nota) {
    if (nota === null) return "—";
    return nota.toFixed(1).replace(".", ",");
}

// Variáveis para os cards de resumo
let somaMediasValidas = 0;
let qtdDisciplinasComMedia = 0;
let totalFaltasGeral = 0;
let qtdBomDesempenho = 0;
let qtdPrecisaAtencao = 0;

const corpoTabela = document.getElementById("tabela-corpo");

// Percorre todas as disciplinas para processar os dados e preencher a tabela
dadosBoletim.forEach(item => {
    // Normaliza notas de cada trimestre
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula média apenas com notas válidas existentes
    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let media = null;
    if (notasValidas.length > 0) {
        const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
        media = soma / notasValidas.length;
        somaMediasValidas += media;
        qtdDisciplinasComMedia++;
    }

    // Soma faltas
    const faltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += faltasDisciplina;

    // Define situação
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

    // Cria a linha da tabela no HTML
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>${item.disciplina}</strong></td>
        <td>${formatarExibicaoNota(n1)}</td>
        <td>${formatarExibicaoNota(n2)}</td>
        <td>${formatarExibicaoNota(n3)}</td>
        <td><strong>${formatarExibicaoNota(media)}</strong></td>
        <td>${faltasDisciplina}</td>
        <td class="${situacaoClasse}">${situacaoTexto}</td>
    `;
    corpoTabela.appendChild(tr);
});

// Atualiza os cards de resumo no topo
const mediaGeralFinal = qtdDisciplinasComMedia > 0 
    ? (somaMediasValidas / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") 
    : "—";

document.getElementById("media-geral").textContent = mediaGeralFinal;
document.getElementById("total-faltas").textContent = totalFaltasGeral;
document.getElementById("bom-desempenho").textContent = qtdBomDesempenho;
document.getElementById("precisa-atencao").textContent = qtdPrecisaAtencao;

// NOTA: A frequência de 92% abaixo é apenas demonstrativa/fictícia para esta etapa do projeto.