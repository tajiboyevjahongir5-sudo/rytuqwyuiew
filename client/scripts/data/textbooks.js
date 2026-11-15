// O'zbekiston maktab fizika dasturi (7-sinf asosiy mavzulari)

export const TEXTBOOKS_DATA = [
  {
    id: 'mech-motion',
    grade: 7,
    topicNumber: 1,
    title: 'Mexanik harakat. Tezlik',
    subtitle: 'Jismning fazodagi o‘rni vaqt o‘tishi bilan o‘zgarishi',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // misol video embed
    summary:
      'Jismning boshqa jismlarga nisbatan vaqt o‘tishi bilan vaziyatining o‘zgarishi mexanik harakat deyiladi. Harakatni o‘rganishda sanoq tizimi tanlanadi. Tekis harakatda jism teng vaqt oraliqlarida teng masofalarni bosib o‘tadi.',
    formulas: [
      { name: 'Tezlik', code: 'v = s / t', desc: 'v — tezlik (m/s), s — yo‘l (m), t — vaqt (s)' },
      { name: 'Bosib o‘tilgan yo‘l', code: 's = v · t', desc: 'To‘g‘ri chiziqli tekis harakatda' },
      { name: 'O‘rtacha tezlik', code: 'v_o‘rt = s_jami / t_jami', desc: 'Notekis harakat uchun' },
    ],
    labLink: null,
    quiz: [
      {
        question: 'Avtomobil 2 soatda 120 km yo‘l bosdi. Uning tezligi qancha?',
        options: ['60 km/soat', '240 km/soat', '30 km/soat'],
        answer: 0,
      },
      {
        question: 'SI xalqaro birliklar sistemasida tezlik birligi nima?',
        options: ['km/soat', 'm/s', 'sm/s'],
        answer: 1,
      },
    ],
  },
  {
    id: 'mass-density',
    grade: 7,
    topicNumber: 2,
    title: 'Massa va Modda zichligi',
    subtitle: 'Moddaning hajm birligidagi massasi',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary:
      'Inersiyalilik xossasining o‘lchovi massa deyiladi (birligi — kg). Bir xil hajmdagi turli moddalarning massasi har xil bo‘ladi. Bir xil moddaning zichligi o‘zgarmas kattalikdir.',
    formulas: [
      { name: 'Zichlik', code: 'ρ = m / V', desc: 'ρ (ro) — zichlik (kg/m³), m — massa (kg), V — hajm (m³)' },
      { name: 'Massa', code: 'm = ρ · V', desc: 'Zichlik va hajm orqali massani topish' },
    ],
    labLink: null,
    quiz: [
      {
        question: 'Suvning zichligi qancha?',
        options: ['1000 kg/m³', '800 kg/m³', '13600 kg/m³'],
        answer: 0,
      },
    ],
  },
  {
    id: 'gravity-freefall',
    grade: 7,
    topicNumber: 3,
    title: 'Og‘irlik kuchi va Erkin tushish',
    subtitle: 'Nyuton qonuni va Yerning tortishish kuchi',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary:
      'Yer barcha jismlarni o‘z markaziga tortadi. Faqat og‘irlik kuchi taʼsirida pastga tushish erkin tushish deyiladi. Galiley tajribalari ko‘rsatdiki, vakuumda barcha jismlar massasidan qatʼi nazar bir xil tezlanish (g ≈ 9.8 m/s²) bilan tushadi.',
    formulas: [
      { name: 'Og‘irlik kuchi', code: 'F_og‘ = m · g', desc: 'm — massa (kg), g — erkin tushish tezlanishi (~9.8 m/s²)' },
      { name: 'Erkin tushish balandligi', code: 'h = (g · t²) / 2', desc: 'Boshlang‘ich tezliksiz tushganda' },
      { name: 'Tushish tezligi', code: 'v = g · t', desc: 't vaqt o‘tgach erishilgan tezlik' },
    ],
    labLink: '/lab', // 3D Laboratoriyaga to'g'ridan-to'g'ri o'tish!
    quiz: [
      {
        question: 'Oyda og‘irlik kuchi Yerdagidan necha marta kam?',
        options: ['Taxminan 6 marta', '2 marta', 'Bir xil'],
        answer: 0,
      },
      {
        question: 'Agar havoni so‘rib olsak (vakuumda), og‘ir metall shar bilan yengil pat qanday tushadi?',
        options: ['Bir vaqtda tushadi', 'Shar tezroq tushadi', 'Pat tushmaydi'],
        answer: 0,
      },
    ],
  },
  {
    id: 'pressure-pascal',
    grade: 7,
    topicNumber: 4,
    title: 'Bosim. Paskal qonuni',
    subtitle: 'Kuchning sirt yuziga taqsimlanishi',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    summary:
      'Sirtga tik yo‘nalgan kuchning shu sirt yuziga nisbati bosim deyiladi. Birligi — Paskal (Pa). Suyuqlik va gazlarga berilgan tashqi bosim barcha yo‘nalishlarda bir xilda uzatiladi (Paskal qonuni).',
    formulas: [
      { name: 'Qattiq jism bosimi', code: 'p = F / S', desc: 'p — bosim (Pa), F — kuch (N), S — yuza (m²)' },
      { name: 'Gidrostatik bosim', code: 'p = ρ · g · h', desc: 'Suyuqlik ustunining tubiga bosimi' },
    ],
    labLink: null,
    quiz: [
      {
        question: 'Oyoq kiyim tagi keng bo‘lsa, qorga botish kamayadimi yoki ko‘payadimi?',
        options: ['Kamayadi (chunki bosim kamayadi)', 'Ko‘payadi', 'O‘zgarmaydi'],
        answer: 0,
      },
    ],
  },
];
