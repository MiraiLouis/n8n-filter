// 07 — CV
// Mode du nœud Code : Run Once for Each Item
// Coller tout ce fichier dans le nœud. Ne pas ajouter de require.


// Premier collage, avant l'appel Mistral du CV : laisser 'prompt'.
// Second collage, après la réponse Mistral : remplacer par 'patch'.
const MODE = 'prompt';

const PROFIL = {
  nom: 'Louis Chen',
  intitule: 'Ingénieur en Intelligence Artificielle',
  email: 'chenlouis.pro@gmail.com',
  telephone: '+33 6 66 64 72 75',
  linkedin: 'https://www.linkedin.com/in/louis-chen-cy',
  github: 'https://github.com/MiraiLouis',
  resume:
    "Ingénieur spécialisé en intelligence artificielle, diplômé en 2025. " +
    "L'expérience professionnelle se limite à des stages : IA appliquée chez Thales " +
    "(RAG, agents) et SecOps à l'Institut Curie. Pas de CDI ni de CDD passé.",
  competences: [
    {
      competence: 'Diplôme ingénieur IA',
      type: 'formation',
      texte: "CY Tech, Cergy — diplôme d'ingénieur, Intelligence Artificielle (2022-2025).",
      motsCles: 'ingénieur ia cy tech bac+5',
    },
    {
      competence: 'Data Engineering',
      type: 'formation',
      texte: 'Syddansk Universitet (SDU), Odense — échange Data Engineering (2023-2024).',
      motsCles: 'data engineering sdu',
    },
    {
      competence: 'Classes préparatoires MP',
      type: 'formation',
      texte: 'Lycée Janson de Sailly, Paris — classes préparatoires MP (2020-2022).',
      motsCles: 'prepa mp',
    },
    {
      competence: 'Stage ingénieur IA Thales',
      type: 'experience',
      texte:
        "Stage ingénieur IA, Thales, Vélizy (avril 2025 - octobre 2025). " +
        "Architectures IA présentées aux métiers et à la technique. Système RAG pour générer du code AltaRica. " +
        "Orchestrateur d'agents pour le logiciel MBSA System Analyst (LangChain, LangGraph, FAISS). " +
        "Validation sur un cas d'étude : temps de modélisation réduit d'une semaine à un jour.",
      motsCles: 'rag agents langchain langgraph faiss thales',
    },
    {
      competence: 'Stage SecOps Institut Curie 2024',
      type: 'experience',
      texte:
        "Stage ingénieur SecOps, Institut Curie, Paris (avril 2024 - septembre 2024). " +
        "Scripts Python et API pour automatiser des tâches de sécurité. Tableau de bord Power BI. " +
        "Administration d'outils de sécurité (antivirus, bastion, proxy).",
      motsCles: 'python powerbi securite',
    },
    {
      competence: 'Stage SecOps Institut Curie 2023',
      type: 'experience',
      texte:
        "Stage ingénieur SecOps, Institut Curie, Paris (juin 2023 - septembre 2023). " +
        "Déploiement d'un outil de scan de vulnérabilités. Reprise d'un site SharePoint interne.",
      motsCles: 'python sharepoint vulnerabilites',
    },
    {
      competence: 'Classification de textes',
      type: 'projet',
      texte:
        "Pipeline NLP de classification multilabel, une dizaine de catégories. " +
        "Prétraitement, vectorisation, XGBoost et scikit-learn (2026).",
      motsCles: 'nlp xgboost scikit-learn classification',
    },
    {
      competence: 'Workflows n8n et Notion',
      type: 'projet',
      texte:
        "Workflows d'automatisation n8n, Docker et synchronisation vers une base Notion (2026).",
      motsCles: 'n8n docker notion automatisation',
    },
    {
      competence: 'Extraction de cartes PDF',
      type: 'projet',
      texte:
        "Extraction d'informations depuis des cartes PDF : CNN (VGG16/ResNet), OpenCV, GDAL et OCR. " +
        "Classification et géocodage, environ 80 % de précision (2024).",
      motsCles: 'computer vision ocr cnn opencv',
    },
    {
      competence: 'Publication Lambda Mu',
      type: 'publication',
      texte:
        "Co-auteur, « Augmentation par l'IA de l'outil MBSA System Analyst », Lambda Mu 25 (IMdR), Grenoble, octobre 2026.",
      motsCles: 'publication recherche mbsa',
    },
    {
      competence: 'Python et données',
      type: 'technique',
      texte: 'Python, Pandas, NumPy, SQL (MySQL), Git, Jupyter, Linux.',
      motsCles: 'python pandas numpy sql git linux',
    },
    {
      competence: 'Machine learning',
      type: 'technique',
      texte: 'Scikit-learn, XGBoost, PyTorch, TensorFlow, pipelines ML, NLP, RAG, agents IA, fine-tuning.',
      motsCles: 'pytorch tensorflow sklearn rag nlp llm',
    },
    {
      competence: 'Langues',
      type: 'langue',
      texte: 'Français natif, anglais C1 (TOEIC), chinois courant.',
      motsCles: 'francais anglais chinois',
    },
  ],
};


const SYSTEME = [
  "Tu filtres une offre d'emploi pour Louis Chen, ingénieur en intelligence artificielle diplômé en 2025.",
  "Son expérience professionnelle se limite à des stages : IA appliquée chez Thales (RAG, agents, environ 6 mois) et SecOps à l'Institut Curie. Il n'a pas eu de CDI ni de CDD.",
  "Tu réponds uniquement avec un objet JSON, sans texte autour.",
  "Clés obligatoires : decision, annees, experienceOk, missionsOk, contrat, titre, entreprise, localisation, motifs, analyse.",
  "decision vaut exactement : compatible, limite, incompatible ou incertain.",
  "experienceOk et missionsOk sont des booléens.",
  "motifs est un tableau de phrases courtes. analyse est un paragraphe en français.",
  "contrat vaut CDI, CDD, VIE, Stage, Alternance, Freelance ou Non précisé.",
  "Règles :",
  "- Incompatible si le titre est senior, lead, staff, principal, head of, directeur, engineering manager, VP, CTO ou responsable d'équipe.",
  "- Incompatible si l'expérience demandée est un minimum d'au moins 3 ans, un « 3+ », un « plus de 3 ans », ou une fourchette dont le maximum dépasse 3 ans (3-5, 2-4).",
  "- « Jusqu'à 3 ans », « 0-2 ans » et « 1-3 ans » restent acceptables pour l'expérience.",
  "- Un « 3 ans » isolé, ou les mots confirmé et expert, ne suffisent pas à rejeter : decision = limite si le métier colle.",
  "- Incompatible si le contrat est un stage, une alternance ou du freelance.",
  "- CDI, CDD, VIE et graduate program sont acceptés. Les ESN et le conseil aussi, si le métier colle.",
  "- Incompatible si un doctorat est exigé. Un doctorat indiqué comme simple atout ne rejette pas.",
  "- missionsOk = true seulement si le poste touche à l'IA, à la data, au logiciel ou au développement.",
  "- Pas de filtre sur la ville ni le pays.",
  "- compatible seulement si l'expérience, les missions et le contrat conviennent, et que le texte suffit à le voir.",
  "- incertain si la page est illisible et que le mail ne permet pas de trancher. N'invente ni l'entreprise, ni les années, ni le contrat.",
].join('\n');

function extraireJson(content) {
  const text = String(content || '').trim();
  if (!text) throw new Error('Réponse Mistral vide');
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSON absent de la réponse Mistral');
  return JSON.parse(raw.slice(start, end + 1));
}

function contenuMessage(reponse) {
  if (!reponse) throw new Error('Réponse Mistral absente');
  if (typeof reponse === 'string') {
    try {
      return contenuMessage(JSON.parse(reponse));
    } catch {
      return reponse;
    }
  }
  return reponse.choices?.[0]?.message?.content
    || reponse.content
    || '';
}

function corpsMistral(offre) {
  const utilisateur = [
    `Titre vu dans le mail : ${offre.titre || ''}`,
    `Source : ${offre.source || ''}`,
    `Lien : ${offre.lien || ''}`,
    `Lecture de la page : ${offre.lecture || 'mail seul'}`,
    `Sujet du mail : ${offre.sujet || ''}`,
    '',
    'Texte de la page :',
    offre.texteOffre || '(page illisible ou absente)',
    '',
    'Extrait du mail :',
    offre.extrait || '(vide)',
  ].join('\n');

  return {
    model: 'mistral-small-latest',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEME },
      { role: 'user', content: utilisateur },
    ],
  };
}

function lireReponseMistral(reponse) {
  const data = extraireJson(contenuMessage(reponse));
  const decisions = ['compatible', 'limite', 'incompatible', 'incertain'];
  const decision = decisions.includes(data.decision) ? data.decision : 'incertain';
  return {
    decision,
    anneesDemandees: data.annees ? String(data.annees) : '',
    experienceOk: Boolean(data.experienceOk),
    missionsOk: Boolean(data.missionsOk),
    contrat: data.contrat ? String(data.contrat) : '',
    titre: data.titre ? String(data.titre) : '',
    entreprise: data.entreprise ? String(data.entreprise) : '',
    localisation: data.localisation ? String(data.localisation) : '',
    motifsIa: Array.isArray(data.motifs) ? data.motifs.map(String) : [],
    analyse: data.analyse ? String(data.analyse) : '',
  };
}

function fusionnerReponse(offre, lu) {
  return {
    ...offre,
    decision: lu.decision,
    anneesDemandees: lu.anneesDemandees || offre.anneesDemandees || '',
    experienceOk: lu.experienceOk,
    missionsOk: lu.missionsOk,
    contrat: lu.contrat || offre.contratPage || offre.contrat || '',
    titre: lu.titre || offre.titre,
    entreprise: lu.entreprise || offre.entreprisePage || offre.entreprise || '',
    localisation: lu.localisation || offre.localisationPage || offre.localisation || '',
    motifs: [...(offre.motifs || []), ...lu.motifsIa],
    motifsIa: lu.motifsIa,
    analyse: lu.analyse,
  };
}


function texteRiche(valeur, max) {
  const contenu = String(valeur || '').slice(0, max || 1900);
  if (!contenu) return { rich_text: [] };
  return { rich_text: [{ type: 'text', text: { content: contenu } }] };
}

function texteRicheLong(valeur) {
  const contenu = String(valeur || '').slice(0, 19000);
  if (!contenu) return { rich_text: [] };
  const blocs = [];
  for (let i = 0; i < contenu.length && blocs.length < 10; i += 1900) {
    blocs.push({ type: 'text', text: { content: contenu.slice(i, i + 1900) } });
  }
  return { rich_text: blocs };
}

function selection(nom) {
  return nom ? { select: { name: nom } } : { select: null };
}

function dateNotion(valeur) {
  const debut = String(valeur || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(debut)) return { date: null };
  return { date: { start: debut } };
}

function urlNotion(lien) {
  if (!lien || !/^https?:\/\//i.test(lien)) return { url: null };
  return { url: lien };
}

function statutNotion(offre) {
  if (offre.rejetEvident || offre.decision === 'rejetee') return 'Rejetée (règles)';
  if (offre.decision === 'compatible') return 'À postuler';
  if (offre.decision === 'limite') return 'Limite';
  if (offre.decision === 'incompatible') return 'Rejetée (IA)';
  return 'À vérifier';
}

function decisionNotion(offre) {
  if (offre.rejetEvident || offre.decision === 'rejetee') return 'rejetée';
  if (['compatible', 'limite', 'incompatible', 'incertain'].includes(offre.decision)) return offre.decision;
  return 'incertain';
}

function lectureNotion(offre) {
  if (offre.lecture === 'complète' || offre.lecture === 'mail seul') return offre.lecture;
  if (!offre.lien || offre.rejetEvident) return 'mail seul';
  return 'complète';
}

function contratNotion(offre) {
  const brut = String(offre.contrat || offre.contratPage || '').trim().toLowerCase();
  const table = {
    cdi: 'CDI',
    cdd: 'CDD',
    vie: 'VIE',
    stage: 'Stage',
    alternance: 'Alternance',
    freelance: 'Freelance',
    'graduate program': 'VIE',
    graduate: 'VIE',
  };
  if (table[brut]) return table[brut];
  if (brut.includes('altern')) return 'Alternance';
  if (brut.includes('stage') || brut.includes('intern')) return 'Stage';
  if (brut.includes('free') || brut.includes('portage')) return 'Freelance';
  if (brut.includes('vie') || brut.includes('graduate')) return 'VIE';
  if (brut.includes('cdd') || brut.includes('temporary')) return 'CDD';
  if (brut.includes('cdi') || brut.includes('full')) return 'CDI';
  const motifs = (offre.motifs || []).join(' ').toLowerCase();
  if (motifs.includes('alternance')) return 'Alternance';
  if (motifs.includes('freelance')) return 'Freelance';
  if (motifs.includes('stage')) return 'Stage';
  return 'Non précisé';
}

function experienceCoche(offre) {
  if (typeof offre.experienceOk === 'boolean' && !offre.rejetEvident) return offre.experienceOk;
  const motifs = (offre.motifs || []).join(' ');
  if (/Expérience demandée|Titre senior/.test(motifs)) return false;
  return offre.decision === 'compatible' || offre.decision === 'limite';
}

function missionsCoche(offre) {
  if (typeof offre.missionsOk === 'boolean' && !offre.rejetEvident) return offre.missionsOk;
  const motifs = (offre.motifs || []).join(' ');
  if (motifs.includes('Hors IA')) return false;
  return offre.decision === 'compatible' || offre.decision === 'limite';
}

function corpsNotion(offre, databaseId) {
  const titre = offre.titre || offre.sujet || 'Offre sans titre';
  const empreinte = `${offre.messageId || ''}|${offre.lien || titre}`;
  const analyse = offre.analyse || '';
  const extrait = offre.extrait || String(offre.texteOffre || '').slice(0, 500);
  return {
    parent: { database_id: databaseId || 'COLLER_ID_BASE_OFFRES' },
    properties: {
      Offre: { title: [{ type: 'text', text: { content: String(titre).slice(0, 180) } }] },
      Entreprise: texteRiche(offre.entreprise || offre.entreprisePage || ''),
      Source: selection(offre.source || 'Site carrière'),
      Lien: urlNotion(offre.lien),
      'Date mail': dateNotion(offre.dateMail),
      Statut: selection(statutNotion(offre)),
      Décision: selection(decisionNotion(offre)),
      'Années demandées': texteRiche(offre.anneesDemandees || ''),
      'Expérience OK': { checkbox: experienceCoche(offre) },
      'Missions OK': { checkbox: missionsCoche(offre) },
      Motifs: texteRiche((offre.motifs || []).join('\n')),
      Analyse: texteRiche(analyse),
      Extrait: texteRiche(extrait),
      Contrat: selection(contratNotion(offre)),
      Localisation: texteRiche(offre.localisation || offre.localisationPage || ''),
      Empreinte: texteRiche(empreinte),
      'Sujet mail': texteRiche(offre.sujet || ''),
      Lecture: selection(lectureNotion(offre)),
      CV: texteRiche(''),
    },
  };
}



function lireRich(prop) {
  if (!prop) return '';
  const blocs = prop.rich_text || prop.title || [];
  return blocs.map((bloc) => bloc.plain_text || (bloc.text && bloc.text.content) || '').join('');
}

function competencesDepuisNotion(resultats) {
  const data = resultats && resultats.results
    ? resultats
    : (resultats && resultats.resultatsCompetences) || {};
  const results = data.results || [];
  return results.map((page) => {
    const props = page.properties || {};
    return {
      competence: lireRich(props['Compétence'] || props.Competence || props.Nom),
      type: (props.Type && props.Type.select && props.Type.select.name) || '',
      texte: lireRich(props.Texte),
      motsCles: lireRich(props['Mots-clés'] || props['Mots-cles'] || props.MotsCles),
    };
  }).filter((ligne) => ligne.competence || ligne.texte);
}

function formaterCompetences(lignes) {
  return lignes.map((ligne) => {
    const nom = ligne.competence || 'Sans titre';
    const type = ligne.type ? ` (${ligne.type})` : '';
    return `- ${nom}${type} : ${ligne.texte || ''}`;
  }).join('\n');
}

function corpsMistralCv(offre, competences) {
  const lignes = competences && competences.length ? competences : PROFIL.competences;
  const systeme = [
    'Tu rédiges un CV ciblé en français, en texte brut.',
    'Tu réponds uniquement avec un objet JSON {"cv":"..."} .',
    'Tu utilises seulement les expériences, projets et compétences fournis. Tu n\'inventes aucun employeur, aucune date, aucun outil.',
    'Les stages restent des stages. Tu ne les présentes pas comme des CDI.',
    'Tu gardes ce qui sert l\'offre et tu retires le reste.',
    'Sections, dans cet ordre : En-tête, Profil, Formation, Expérience, Projets, Compétences, Langues.',
    'L\'en-tête reprend le nom et les coordonnées fournis.',
  ].join('\n');
  const utilisateur = [
    `Identité : ${PROFIL.nom}, ${PROFIL.intitule}`,
    `Email : ${PROFIL.email}`,
    `Téléphone : ${PROFIL.telephone}`,
    `LinkedIn : ${PROFIL.linkedin}`,
    `GitHub : ${PROFIL.github}`,
    '',
    `Offre visée : ${offre.titre || ''}`,
    `Entreprise : ${offre.entreprise || offre.entreprisePage || ''}`,
    `Lien : ${offre.lien || ''}`,
    '',
    'Texte de l\'offre :',
    offre.texteOffre || offre.extrait || '',
    '',
    'Compétences et expériences autorisées :',
    formaterCompetences(lignes),
  ].join('\n');

  return {
    model: 'mistral-small-latest',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systeme },
      { role: 'user', content: utilisateur },
    ],
  };
}

function lireCv(reponse) {
  const data = extraireJson(contenuMessage(reponse));
  const cv = String(data.cv || data.texte || '').trim();
  if (!cv) throw new Error('CV absent de la réponse Mistral');
  return cv;
}

function patchCv(pageId, cv) {
  return {
    pageId: pageId || '',
    body: {
      properties: {
        CV: texteRicheLong(cv),
      },
    },
  };
}

function ecrireCv(offre) {
  let cv = '';
  let erreurCv = '';
  try {
    cv = lireCv(offre.reponseCv || offre);
  } catch (error) {
    erreurCv = error.message;
  }
  const pageId = offre.pageNotion && offre.pageNotion.id;
  return {
    ...offre,
    cv,
    erreurCv,
    patchCv: pageId && cv ? patchCv(pageId, cv) : null,
  };
}


const offre = $input.item.json;

if (MODE === 'patch') {
  return { json: ecrireCv(offre) };
}

if (!['compatible', 'limite'].includes(offre.decision)) {
  return { json: { ...offre, genererCv: false } };
}

const competences = competencesDepuisNotion(offre.resultatsCompetences);
return {
  json: {
    ...offre,
    genererCv: true,
    mistralCv: corpsMistralCv(offre, competences),
  },
};
