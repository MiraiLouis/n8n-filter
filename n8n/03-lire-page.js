// 03 — Lire la page
// Mode du nœud Code : Run Once for Each Item
// Coller tout ce fichier dans le nœud. Ne pas ajouter de require.


function normaliser(valeur) {
  return String(valeur || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\u2019\u2018]/g, "'")
    .toLowerCase();
}

function decoderEntites(valeur) {
  return String(valeur || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function htmlVersTexte(html) {
  return decoderEntites(String(html || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/(div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}



function contenuPage(pageHtml) {
  if (!pageHtml) return '';
  if (typeof pageHtml === 'string') return pageHtml;
  if (typeof pageHtml.body === 'string') return pageHtml.body;
  if (typeof pageHtml.data === 'string') return pageHtml.data;
  if (typeof pageHtml.content === 'string') return pageHtml.content;
  return '';
}

function blocsJson(valeur, acc) {
  if (!valeur) return;
  if (Array.isArray(valeur)) {
    valeur.forEach((item) => blocsJson(item, acc));
    return;
  }
  if (typeof valeur !== 'object') return;
  const type = valeur['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((item) => String(item || '').toLowerCase() === 'jobposting')) acc.push(valeur);
  if (valeur['@graph']) blocsJson(valeur['@graph'], acc);
}

function premierJob(html) {
  const jobs = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    try {
      blocsJson(JSON.parse(match[1].trim()), jobs);
    } catch {
      // Un bloc illisible ne bloque pas les suivants.
    }
  }
  return jobs[0] || null;
}

function nomOrganisation(valeur) {
  if (!valeur) return '';
  if (typeof valeur === 'string') return valeur;
  return valeur.name || '';
}

function lieuJob(job) {
  const lieu = job.jobLocation;
  const premier = Array.isArray(lieu) ? lieu[0] : lieu;
  const adresse = premier && premier.address;
  if (!adresse) return '';
  if (typeof adresse === 'string') return adresse;
  return [adresse.addressLocality, adresse.addressRegion, adresse.addressCountry]
    .filter(Boolean)
    .join(', ');
}

function contratSchema(employmentType) {
  const type = normaliser(Array.isArray(employmentType) ? employmentType[0] : employmentType);
  if (type.includes('intern')) return 'Stage';
  if (type.includes('contractor') || type.includes('freelance')) return 'Freelance';
  if (type.includes('temporary')) return 'CDD';
  if (type.includes('full')) return 'CDI';
  if (type.includes('part')) return 'CDD';
  return '';
}

function formeJob(job, description, lecture) {
  const titrePage = htmlVersTexte(job.title || '');
  const entreprisePage = nomOrganisation(job.hiringOrganization);
  const localisationPage = lieuJob(job);
  const contratPage = contratSchema(job.employmentType);
  const experience = htmlVersTexte(
    typeof job.experienceRequirements === 'string' ? job.experienceRequirements : '',
  );
  const lignes = [
    titrePage && `Titre: ${titrePage}`,
    entreprisePage && `Entreprise: ${entreprisePage}`,
    localisationPage && `Lieu: ${localisationPage}`,
    contratPage && `Contrat: ${contratPage}`,
    experience && `Expérience indiquée: ${experience}`,
    '',
    description,
  ].filter((ligne) => ligne !== false && ligne !== null);
  return {
    texteOffre: lignes.join('\n').slice(0, 12000),
    lecture,
    titrePage,
    entreprisePage,
    localisationPage,
    contratPage,
  };
}

function lireJsonBrut(brut) {
  let data;
  try {
    data = JSON.parse(brut);
  } catch {
    return null;
  }
  const source = Array.isArray(data) ? data[0] : data;
  if (!source || typeof source !== 'object') return null;
  const description = htmlVersTexte(
    source.descriptionPlain || source.description || source.content || source.texte || '',
  );
  if (description.length < 180) return null;
  return formeJob(
    {
      title: source.title || source.name || source.text,
      hiringOrganization: source.company || source.organization,
      description,
    },
    description,
    'complète',
  );
}

function estMur(html, visible) {
  const extrait = normaliser(`${html}\n${visible}`).slice(0, 8000);
  const mur = /authwall|join linkedin|sign in|sign-in|se connecter|identifiez-vous|create an account|log in to glassdoor|connexion requise/.test(extrait);
  if (!mur) return false;
  return normaliser(visible).length < 800;
}

function pageVide() {
  return {
    texteOffre: '',
    lecture: 'mail seul',
    titrePage: '',
    entreprisePage: '',
    localisationPage: '',
    contratPage: '',
  };
}

function lirePage(pageHtml) {
  const brut = contenuPage(pageHtml);
  if (!brut.trim()) return pageVide();

  const job = premierJob(brut);
  if (job) {
    const description = htmlVersTexte(job.description || job.responsibilities || '');
    if (description.length >= 180) return formeJob(job, description, 'complète');
  }

  const coupe = brut.trim();
  if (coupe.startsWith('{') || coupe.startsWith('[')) {
    const depuisJson = lireJsonBrut(coupe);
    if (depuisJson) return depuisJson;
  }

  const visible = htmlVersTexte(brut);
  if (estMur(brut, visible) || visible.length < 350) return pageVide();

  return {
    texteOffre: visible.slice(0, 12000),
    lecture: 'complète',
    titrePage: '',
    entreprisePage: '',
    localisationPage: '',
    contratPage: '',
  };
}


const offre = $input.item.json;
const page = lirePage(offre.pageHtml);
return {
  json: {
    ...offre,
    ...page,
    titre: page.titrePage || offre.titre,
    entreprise: offre.entreprise || page.entreprisePage || '',
    localisation: offre.localisation || page.localisationPage || '',
  },
};
