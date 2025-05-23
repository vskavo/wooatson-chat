// wooatson-chat.js

(function () {
  const DOMAIN = window.location.origin;
  const API_URL = 'https://wooatson-client-agent.azurewebsites.net/api/wooatsonclientagent';

  // Leer configuración global si existe
  const config = window.WooAtsonChatConfig || {};

  // --- Personalización de la burbuja ---
  const bubble = document.createElement('div');
  // Permitir texto, emoji o imagen personalizada
  if (config.bubbleImage) {
    const img = document.createElement('img');
    img.src = config.bubbleImage;
    img.alt = config.bubbleAlt || 'Chat';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    bubble.appendChild(img);
  } else {
    bubble.innerText = config.bubbleText || '💬';
  }
  // Posición flexible
  const position = config.bubblePosition || 'bottom-right';
  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px', top: '', left: '' },
    'bottom-left': { bottom: '20px', left: '20px', top: '', right: '' },
    'top-right': { top: '20px', right: '20px', bottom: '', left: '' },
    'top-left': { top: '20px', left: '20px', bottom: '', right: '' }
  };
  const defaultBubbleStyle = {
    position: 'fixed',
    width: '60px', height: '60px', background: '#0078D7',
    color: 'white', fontSize: '30px', textAlign: 'center',
    lineHeight: '60px', borderRadius: '50%', cursor: 'pointer', zIndex: 9999,
    ...positionStyles[position]
  };
  Object.assign(bubble.style, defaultBubbleStyle, config.bubbleStyle || {});
  if (config.bubbleTooltip) bubble.title = config.bubbleTooltip;
  document.body.appendChild(bubble);

  // --- Personalización de la ventana de chat ---
  const chatBox = document.createElement('div');
  const defaultChatBoxStyle = {
    position: 'fixed',
    width: '300px', height: '400px', background: 'white',
    border: '1px solid #ccc', borderRadius: '10px',
    display: 'none', flexDirection: 'column', fontFamily: 'sans-serif', zIndex: 9999,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
  };
  // Posición de la ventana igual que la burbuja
  Object.assign(defaultChatBoxStyle, positionStyles[position]);
  if (defaultChatBoxStyle.bottom) defaultChatBoxStyle.bottom = (parseInt(defaultChatBoxStyle.bottom) + 70) + 'px';
  if (defaultChatBoxStyle.top) defaultChatBoxStyle.top = (parseInt(defaultChatBoxStyle.top) + 70) + 'px';
  Object.assign(chatBox.style, defaultChatBoxStyle, config.chatBoxStyle || {});

  chatBox.innerHTML = `
    <div id="chat-header" style="padding: 10px; background: ${config.headerBg || '#0078D7'}; color: ${config.headerColor || 'white'}; border-radius: 10px 10px 0 0; font-weight: bold;">
      ${config.headerText || 'Chat'}
    </div>
    <div id="chat-messages" style="flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column;"></div>
    <form id="chat-form" style="display: flex; border-top: 1px solid #ccc;">
      <input type="text" id="chat-input" placeholder="${config.inputPlaceholder || 'Escribe tu mensaje...'}"
        style="flex: 1; padding: 10px; border: none;">
      <button type="submit" style="background: ${config.buttonBg || '#0078D7'}; color: ${config.buttonColor || 'white'}; border: none; padding: 0 15px;">${config.buttonText || 'Enviar'}</button>
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
    // Detectar si el mensaje es HTML puro (bloque ```html ... ```
    const htmlBlock = text.match(/```html\n([\s\S]*?)```/i);
    const div = document.createElement('div');
    if (htmlBlock && sender !== 'Tú') {
      div.className = 'bot-message';
      div.innerHTML = htmlBlock[1].trim(); // Mostrar solo el HTML, sin encabezado ni salto de línea
    } else {
      div.className = sender === 'Tú' ? 'user-message' : 'bot-message';
      div.innerHTML = `<strong>${sender}:</strong><br>${renderMarkdown(text)}`;
      div.style.background = sender === 'Tú' ? '#e0f0ff' : '#f1f1f1';
    }
    div.style.marginBottom = '10px';
    div.style.padding = '8px';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '90%';
    div.style.alignSelf = sender === 'Tú' ? 'flex-end' : 'flex-start';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderMarkdown(text) {
    // Si el texto viene en un bloque de código HTML, renderizar el HTML tal cual
    const htmlBlock = text.match(/```html\n([\s\S]*?)```/i);
    if (htmlBlock) {
      return htmlBlock[1];
    }

    let html = text
      // Títulos Markdown (###, ##, #)
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      // Listas numeradas
      .replace(/^\s*\d+\. (.*)$/gm, '<li>$1</li>')
      // Listas con guion
      .replace(/^\s*[-•] (.*)$/gm, '<li>$1</li>')
      // Imágenes ![alt](url)
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; margin-top:8px;"/>')
      // Enlaces [texto](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // URLs sueltas
      .replace(/(https?:\/\/[\w.-]+(?:\.[\w\.-]+)+(?:[\w\-._~:/?#\[\]@!$&'()*+,;=.]+)?)/g, '<a href="$1" target="_blank">$1</a>')
      // Negritas **texto**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Saltos de línea dobles a <br><br>
      .replace(/\n\n/g, '<br><br>')
      // Saltos de línea simples a <br>
      .replace(/\n/g, '<br>');

    // Convertir <li> sueltos en listas <ul> o <ol>
    html = html.replace(/(<li>.*?<\/li>)/gs, function(match) {
      // Si hay números al inicio, usar <ol>, si no, <ul>
      if (/\d+\./.test(match)) {
        return '<ol>' + match + '</ol>';
      } else {
        return '<ul>' + match + '</ul>';
      }
    });

    return html;
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
