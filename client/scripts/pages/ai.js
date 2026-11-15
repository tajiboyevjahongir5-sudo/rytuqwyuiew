// AI Ustoz (Physics AI Tutor) sahifasi

import { api } from '../api.js';
import { showToast } from '../components/toast.js';

export function render(ctx) {
  const root = document.createElement('div');
  root.className = 'page ai-page';

  let messages = [
    {
      role: 'assistant',
      text: 'Assalomu alaykum! Men sizning **Fizika bo‘yicha AI Ustozingizman** 🧑‍🏫\n\nFizikadan istalgan mavzuni so‘rashingiz yoki masalani yuborishingiz mumkin. Har bir qadamini batafsil yechib beraman!',
    },
  ];

  root.innerHTML = `
    <header class="page__header">
      <h1 class="page__title">AI Fizika Ustozi</h1>
      <p class="page__subtitle">Fizika masalalarini bosqichma-bosqich yechish va mavzularni oson tushunish</p>
    </header>

    <!-- Tezkor namunaviy savollar -->
    <div class="ai-prompts" id="quickPrompts">
      <button class="chip" data-prompt="7-sinf: Erkin tushish formulasi va misol">Erkin tushish formulasi</button>
      <button class="chip" data-prompt="Jism 20 m balandlikdan erkin tushmoqda. U qancha vaqtda yerga tushadi?">20m dan tushish masalasi</button>
      <button class="chip" data-prompt="Paskal qonunini hayotiy misol bilan tushuntirib ber">Paskal qonuni</button>
      <button class="chip" data-prompt="Tezlik nima va uning formulasi qanday?">Tezlik formulasi</button>
    </div>

    <!-- Chat oynasi -->
    <div class="ai-chat-card card">
      <div class="chat-messages" id="chatMessages"></div>

      <div class="chat-input-row">
        <textarea id="chatInput" class="chat-input" rows="2" placeholder="Fizika masalasi yoki savolingizni yozing..."></textarea>
        <button id="sendBtn" class="btn btn--primary send-btn">
          <span>Yuborish</span>
        </button>
      </div>
    </div>
  `;

  const chatMessages = root.querySelector('#chatMessages');
  const chatInput = root.querySelector('#chatInput');
  const sendBtn = root.querySelector('#sendBtn');
  const quickPrompts = root.querySelector('#quickPrompts');

  function renderMessages() {
    chatMessages.innerHTML = '';
    messages.forEach((m) => {
      const msgEl = document.createElement('div');
      msgEl.className = `chat-bubble chat-bubble--${m.role}`;
      // Markdown qatorlarni xavfsiz formatlash
      msgEl.innerHTML = formatMarkdown(m.text);
      chatMessages.appendChild(msgEl);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function formatMarkdown(text) {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
    return html;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    messages.push({ role: 'user', text });
    renderMessages();
    chatInput.value = '';

    // Yuklanish holati
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble chat-bubble--assistant';
    loadingBubble.innerHTML = '<span class="typing-indicator">O‘ylanmoqda...</span>';
    chatMessages.appendChild(loadingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    sendBtn.disabled = true;

    try {
      const history = messages
        .filter((m) => m.role !== 'loading')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await api.post('/ai/chat', { message: text, history });
      loadingBubble.remove();
      messages.push({ role: 'assistant', text: res.reply });
      renderMessages();
    } catch (err) {
      loadingBubble.remove();
      showToast('Xatolik yuz berdi. Qaytadan urinib ko‘ring', { type: 'error' });
      messages.push({
        role: 'assistant',
        text: 'Kechirasiz, javob olishda uzilish bo‘ldi. Iltimos qaytadan savol bering.',
      });
      renderMessages();
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  sendBtn.addEventListener('click', () => {
    sendMessage(chatInput.value);
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  quickPrompts.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      sendMessage(chip.dataset.prompt);
    }
  });

  renderMessages();
  return root;
}
