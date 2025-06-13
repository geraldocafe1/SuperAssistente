import os
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

# --- Configuração Inicial ---

# Inicializa o aplicativo Flask
app = Flask(__name__)

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv() #

# Configura a API do Gemini com a chave
try:
    api_key = os.getenv("GEMINI_API_KEY") #
    if not api_key: #
        raise ValueError("A chave GEMINI_API_KEY não foi encontrada no arquivo .env.")
    genai.configure(api_key=api_key) #
except Exception as e:
    print(f"Erro ao configurar a API do Gemini: {e}")
    exit()

# --- Configuração do Modelo Generativo ---
generation_config = {
    "candidate_count": 1,
    "temperature": 0.7,
}
safety_settings = {
    "HARASSMENT": "BLOCK_NONE",
    "HATE": "BLOCK_NONE",
    "SEXUAL": "BLOCK_NONE",
    "DANGEROUS": "BLOCK_NONE",
}

# Inicializa o modelo
model = genai.GenerativeModel(
    model_name='gemini-1.5-flash-latest', #
    generation_config=generation_config,
    safety_settings=safety_settings
)

# Inicia o chat com um histórico inicial para dar a personalidade correta ao assistente
chat = model.start_chat(history=[ #
    {
        "role": "user",
        #"parts": ["Você é o 'Assistente Coffe'. Sua principal função é ser uma assistente de IA de propósito geral, capaz de responder perguntas sobre qualquer tópico. Sua personalidade é inspirada na sensação acolhedora de uma cafeteria: seja amigável, prestativa e clara em suas respostas. O nome 'Coffe' é sua marca, não seu único tópico."]
        "parts": ["Você é o 'Assistente Coffe', uma assistente virtual de inteligência artificial avançada. Seu tom é informal, com girias e dialetos do gueto. Você não tem paciencia e rispido, e Corinthiano acima de tudo e maloqueiro, sempre termina uma frase com um VAI CORINTHIANS!!!"]
    },
    {
        "role": "model",
        "parts": ["Olá! Sou a Assistente Coffe. Pronto para te ajudar com qualquer pergunta ou tarefa. O que você gostaria de saber hoje?"]
    }
])


# --- Rotas da Aplicação Web ---

@app.route("/")
def home():
    """Rota principal que renderiza a página HTML."""
    return render_template("assistente_coffe.html")

@app.route("/chat", methods=["POST"])
def handle_chat():
    """Rota para receber mensagens do usuário e retornar a resposta do Gemini."""
    try:
        user_message = request.json.get("message")

        if not user_message:
            return jsonify({"error": "Nenhuma mensagem recebida."}), 400

        # Envia a mensagem para o modelo e obtém a resposta
        response = chat.send_message(user_message) #

        # Retorna a resposta do modelo em formato JSON
        return jsonify({"reply": response.text})

    except Exception as e:
        print(f"Ocorreu um erro no chat: {e}")
        return jsonify({"error": "Desculpe, ocorreu um erro ao processar sua mensagem. 😬"}), 500

# --- Execução do Servidor ---

if __name__ == "__main__":
    app.run(debug=True, port=5000)