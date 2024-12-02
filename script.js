// Variáveis de controle
let inicioAtual = 1; // Posição inicial para carregamento
let carregando = false; // Evita múltiplas requisições simultâneas
const chaveApi = "8175fA5f6098c5301022f475da32a2aa"; // Chave de acesso à API
let token = ""; // Token obtido após autenticação
const maximoRegistros = 105; // Quantidade máxima de registros disponíveis

// Função para autenticar e obter o token de acesso
async function autenticar() {
  try {
    const resposta = await fetch("https://ucsdiscosapi.azurewebsites.net/Discos/autenticar", {
      method: "POST",
      headers: {
        accept: "*/*",
        ChaveApi: chaveApi,
      },
    });

    if (!resposta.ok) {
      throw new Error("Falha na autenticação com a API");
    }

    // Obtém o token retornado pela API e remove espaços desnecessários
    token = (await resposta.text()).trim();
    console.log("Token obtido com sucesso:", token);
  } catch (erro) {
    console.error("Erro durante autenticação:", erro);
    alert("Erro ao autenticar. Tente novamente mais tarde.");
  }
}

// Função para carregar imagens e exibir no grid
async function carregarImagens(inicio, quantidade) {
  if (carregando || !token) return; // Evita carregar enquanto uma operação já está em andamento
  carregando = true; // Define o estado de carregamento
  document.getElementById("loading").style.display = "block";

  // Reinicia o índice se alcançar o limite máximo
  if (inicio >= maximoRegistros) {
    console.log("Reiniciando contagem...");
    inicioAtual = 1;
    inicio = inicioAtual;
  }

  try {
    // Requisição para buscar registros da API
    const resposta = await fetch(
      `https://ucsdiscosapi.azurewebsites.net/Discos/records?numeroInicio=${inicio}&quantidade=${quantidade}`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
          TokenApiUCS: token,
        },
      }
    );

    if (!resposta.ok) {
      const mensagemErro = await resposta.text();
      console.error("Erro ao carregar imagens:", mensagemErro);
      throw new Error("Não foi possível carregar imagens");
    }

    const registros = await resposta.json(); // Converte os registros recebidos para JSON
    const gridImagens = document.getElementById("image-grid");

    // Itera pelos registros e cria elementos visuais para cada um
    registros.forEach((registro) => {
      if (registro.imagemEmBase64) {
        const coluna = document.createElement("div");
        coluna.className = "col";

        const imagem = document.createElement("img");
        imagem.src = `data:image/png;base64,${registro.imagemEmBase64}`;
        imagem.alt = registro.descricaoPrimaria || "Capa do álbum";
        imagem.className = "album-cover";
        imagem.dataset.id = registro.id;
        imagem.addEventListener("click", () => mostrarDetalhes(imagem.dataset.id));

        coluna.appendChild(imagem);
        gridImagens.appendChild(coluna);
      } else {
        console.warn("Registro sem imagem:", registro);
      }
    });

    inicioAtual += registros.length; // Atualiza a posição inicial para o próximo carregamento
  } catch (erro) {
    console.error("Erro ao carregar imagens:", erro);
    alert("Erro ao carregar imagens. Verifique sua conexão.");
  } finally {
    carregando = false; // Restaura o estado de carregamento
    document.getElementById("loading").style.display = "none";
  }
}

// Função para exibir detalhes no modal
async function mostrarDetalhes(id) {
  try {
    // Requisição para obter detalhes do registro específico
    const resposta = await fetch(`https://ucsdiscosapi.azurewebsites.net/Discos/record?numero=${id}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        TokenApiUCS: token,
      },
    });

    if (!resposta.ok) {
      throw new Error("Erro ao carregar detalhes do álbum");
    }

    const detalhes = await resposta.json();

    // Exibe a imagem no modal
    if (detalhes.imagemEmBase64) {
      document.getElementById("modal-image").src = `data:image/png;base64,${detalhes.imagemEmBase64}`;
    } else {
      document.getElementById("modal-image").src = "https://via.placeholder.com/150?text=Sem+Imagem";
    }

    // Preenche o texto com os detalhes do álbum
    document.getElementById("modal-details").innerText = `
      ID: ${detalhes.id || "Indisponível"}\n
      Descrição: ${detalhes.descricaoPrimaria || "Não disponível"}\n
    `;

    const modal = new bootstrap.Modal(document.getElementById("detailModal"));
    modal.show();
  } catch (erro) {
    console.error("Erro ao carregar detalhes:", erro);
    alert("Erro ao carregar detalhes do álbum. Tente novamente.");
  }
}

// Configuração inicial ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  await autenticar(); // Obtém o token de autenticação
  if (token) {
    carregarImagens(inicioAtual, 12); // Carrega imagens iniciais
  } else {
    alert("Erro ao obter token de autenticação.");
  }
});

// Evento para carregar mais imagens ao rolar a página
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !carregando) {
    carregarImagens(inicioAtual, 4); // Carrega mais imagens ao rolar
  }
});
