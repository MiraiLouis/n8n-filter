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

module.exports = { PROFIL };
