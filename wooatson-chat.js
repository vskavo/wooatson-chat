
// wooatson-chat.js

(function () {
  const DOMAIN = window.location.origin;
  const API_URL = 'https://wooatson-client-agent.azurewebsites.net/api/wooatsonclientagent';

  // Crear la burbuja de chat
  const bubble = document.createElement('div');
  bubble.innerText = '💬';
  Object.assign(bubble.style, {
    position: 'fixed', bottom: '20px', right: '20px',
    width: '60px', height: '60px', background: '#0078D7',
    color: 'white', fontSize: '30px', textAlign: 'center',
    lineHeight: '60px', borderRadius: '50%', cursor: 'pointer', zIndex: 9999
  });
  document.body.appendChild(bubble);

  // Crear la ventana de chat
  const chatBox = document.createElement('div');
  chatBox.style = `
    position: fixed; bottom: 90px; right: 20px; width: 300px; height: 400px;
    background: white; border: 1px solid #ccc; border-radius: 10px;
    display: none; flex-direction: column; font-family: sans-serif; z-index: 9999;
  `;
  chatBox.innerHTML = `
    <div style="padding: 10px; background: #0078D7; color: white;">Chat</div>
    <div id="chat-messages" style="flex: 1; padding: 10px; overflow-y: auto;"></div>
    <form id="chat-form" style="display: flex; border-top: 1px solid #ccc;">
      <input type="text" id="chat-input" placeholder="Escribe tu mensaje..."
        style="flex: 1; padding: 10px; border: none;">
      <button type="submit" style="background: #0078D7; color: white; border: none; padding: 0 15px;">Enviar</button>
    </form>
  `;
  document.body.appendChild(chatBox);

  bubble.onclick = () => {
    chatBox.style.display = chatBox.style.display === 'none' ? 'flex' : 'none';
  };

  const input = chatBox.querySelector('#chat-input');
  const messages = chatBox.querySelector('#chat-messages');
  const form = chatBox.querySelector('#chat-form');

  function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.textContent = `${sender}: ${text}`;
    div.style.marginBottom = '10px';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function generateSessionId() {
    const key = 'wooatson-session-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'session-' + Math.random().toString(36).substring(2);
      localStorage.setItem(key, id);
    }
    return id;
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    appendMessage('Tú', question);

    const searchParams = new URLSearchParams(window.location.search);
    const searchQuery = searchParams.get('s') || searchParams.get('q');
    const referrer = document.referrer;
    const slug = window.location.pathname;

    const payload = {
      sessionId: generateSessionId(),
      domain: DOMAIN,
      pageUrl: window.location.href,
      question: question,
      context: {
        referrer: referrer,
        searchQuery: searchQuery,
        productSlug: slug
      }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      appendMessage('WooAtson', data.answer || 'Sin respuesta.');
    } catch (err) {
      console.error('Error:', err);
      appendMessage('WooAtson', 'Ocurrió un error al procesar tu solicitud.');
    }
  };
})();
