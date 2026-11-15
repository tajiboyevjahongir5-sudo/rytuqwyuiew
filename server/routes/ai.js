import { Router } from 'express';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        text: z.string().max(2000),
      }),
    )
    .optional()
    .default([]),
});

const SYSTEM_PROMPT = `Sen PHYSICA platformasining sun'iy intellektli Fizika Ustozisan (AI Ustoz).
Sen O'zbekiston maktab o'quvchilari (7-11 sinflar) uchun fizika fanini qiziqarli, sodda va ilmiy jihatdan to'liq tushuntirib berasan.

QAT'IY QOIDALAR:
1. FAQAT VA FAQAT FIZIKA: Agar foydalanuvchi fizikadan tashqari mavzularda (tarix, siyosat, biologiya, o'yinlar, oddiy gaplashish va h.k.) savol bersa, muloyimlik bilan:
   "Kechirasiz, men faqat Fizika fani bo'yicha yordam bera oladigan AI Ustozman. Fizikadan qanday savolingiz yoki masalangiz bor?" deb javob ber.
2. MASALA YECHISH TARTIBI: Har qanday fizika masalasini quyidagi aniq tartibda yechib ber:
   - 📌 Berilgan:
   - 🎯 Topish kerak:
   - 📏 SI sistemasiga o'tkazish:
   - 📐 Formulalar:
   - 🔢 Yechish (bosqichma-bosqich hisoblash):
   - 💡 Javob va fizika qonuniyati tahlili:
3. 3D LABORATORIYA TAVSIYASI: Agar masala erkin tushish, og'irlik kuchi, tezlik yoki Nyuton qonunlariga oid bo'lsa, javobing oxirida albatta:
   "🔬 Eslatma: Ushbu jarayonni platformamizning 3D Virtual Laboratoriyasida parametrlarni o'zgartirib jonli sinab ko'rishingiz mumkin!" deb qo'shib qo'y.
4. Til: O'zbek tili (lotin alifbosida), sodda, tushunarli va do'stona ohangda.`;

export function createAiRouter({ config }) {
  const router = Router();

  router.post('/chat', async (req, res) => {
    const parse = chatSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Noto‘g‘ri so‘rov formati', details: parse.error.issues });
    }

    const { message, history } = parse.data;
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      // Kalit bo'lmaganda aqlli fizika javoblari (Demo / Fallback rejim)
      const reply = getFallbackPhysicsReply(message);
      return res.json({ reply, source: 'local-knowledge-base' });
    }

    try {
      // Google Gemini API orqali so'rov yuborish
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const contents = [
        ...history.slice(-6).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.2, // Aniq va ilmiy bo'lishi uchun
            maxOutputTokens: 1200,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API xatosi:', errText);
        const reply = getFallbackPhysicsReply(message);
        return res.json({ reply, source: 'fallback' });
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Kechirasiz, javob olishda xatolik yuz berdi. Iltimos, savolingizni qayta yuboring.';

      res.json({ reply, source: 'gemini' });
    } catch (err) {
      console.error('AI chat xatosi:', err);
      const reply = getFallbackPhysicsReply(message);
      res.json({ reply, source: 'fallback' });
    }
  });

  return router;
}

function getFallbackPhysicsReply(msg) {
  const q = msg.toLowerCase();
  if (q.includes('erkin tushish') || q.includes('og\'irlik') || q.includes('gravitatsiya') || q.includes('tushish')) {
    return `📌 **Erkin tushish bo'yicha tushuntirish:**
Jism faqat og'irlik kuchi ta'sirida harakatlansa, bu erkin tushish deyiladi.
Barcha jismlar Yerda bir xil $g \\approx 9.8\\text{ m/s}^2$ tezlanish bilan tushadi.

📐 **Asosiy formulalar:**
• $h = \\frac{gt^2}{2}$ (boshlang'ich tezliksiz tushganda balandlik)
• $v = gt$ (t vaqtdagi tezlik)
• $v = \\sqrt{2gh}$ (urilish paytidagi tezlik)

🔬 **3D Laboratoriya:** Buni amalda ko'rish uchun platformamizning **3D Laboratoriya** bo'limiga kiring!`;
  }

  if (q.includes('tezlik') || q.includes('harakat') || q.includes('masofa')) {
    return `📌 **Mexanik harakat va Tezlik:**
Jismning vaqt o'tishi bilan o'rni o'zgarishi mexanik harakat deyiladi.

📐 **Formulalar:**
• $v = \\frac{s}{t}$ (tezlik = masofa / vaqt)
• $s = v \\cdot t$ (masofa = tezlik * vaqt)
• $t = \\frac{s}{v}$ (vaqt = masofa / tezlik)

Savolingiz bo'yicha biror masalani yechish kerak bo'lsa, masalaning to'liq shartini yozing!`;
  }

  return `Salom! Men PHYSICA platformasining AI Fizika Ustoziman. 🧑‍🏫

Men sizga 7-11 sinf fizika masalalarini qadamma-qadam yechishda, formulalarni tushunishda va 3D Laboratoriya tajribalarini tahlil qilishda yordam beraman.

Menga fizika bo'yicha istalgan masala shartini yoki tushunmagan mavzuingizni yozing!`;
}
