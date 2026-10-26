const { normaliser, decoderEntites, htmlVersTexte } = require('./texte');

const TITRES_GENERIQUES = /^(voir l['']offre|voir plus|postuler|apply|en savoir plus|cliquez ici|see job|view job|découvrir|decouvrir)$/i;

function hostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function classerSource(url) {
  const hote = hostname(url);
  if (hote.includes('linkedin.com')) return 'LinkedIn';
  if (hote.includes('indeed.')) return 'Indeed';
  if (hote.includes('apec.fr')) return 'Apec';
  if (hote.includes('glassdoor.')) return 'Glassdoor';
  if (hote.includes('welcometothejungle.com') || hote.includes('welcomekit.co')) {
    return 'Welcome to the Jungle';
  }
  return 'Site carrière';
}

function lienDirect(url) {
  try {
    const u = new URL(url);
    const imbrique = u.searchParams.get('q') || u.searchParams.get('url');
    if (imbrique && /^https?:/i.test(imbrique) && /google\./.test(u.hostname)) {
      return imbrique;
    }
  } catch {
    return url;
  }
  return url;
}

function cleLien(url) {
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].forEach((cle) => {
      if (cle.startsWith('utm_') || cle === 'refId' || cle === 'trackingId' || cle === 'trk') {
        u.searchParams.delete(cle);
      }
    });
    const query = u.searchParams.toString();
    return `${u.origin}${u.pathname.replace(/\/$/, '')}${query ? `?${query}` : ''}`;
  } catch {
    return url;
  }
}

function estLienOffre(url) {
  let absolu;
  try {
    absolu = new URL(url);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(absolu.protocol)) return false;

  const tout = `${absolu.hostname}${absolu.pathname}${absolu.search}`.toLowerCase();
  if (/unsubscribe|desinscription|desabonnement|optout|email-preferences|preferences|confidentialite|privacy|linkedin\.com\/help|linkedin\.com\/in\/|linkedin\.com\/feed|facebook\.com|twitter\.com|instagram\.com|youtube\.com|apple\.com|play\.google/.test(tout)) {
    return false;
  }

  const hote = absolu.hostname.toLowerCase();
  if (hote.includes('linkedin.com')) return /\/jobs\/view\/|\/comm\/jobs\//.test(tout);
  if (hote.includes('indeed.')) return /viewjob|rc\/clk|pagead|\/job\//.test(tout);
  if (hote.includes('apec.fr')) return /offre|emploi|detail/.test(tout);
  if (hote.includes('glassdoor.')) return /job|emploi|partner/.test(tout);
  if (hote.includes('welcometothejungle.com') || hote.includes('welcomekit.co')) {
    return /\/jobs\/|\/emploi/.test(tout);
  }
  return /jobs?|emploi|career|carriere|offre|posting|lever\.co|greenhouse\.io|ashbyhq|smartrecruiters|myworkdayjobs|workable|recruitee|teamtailor/.test(tout);
}

function adresseFrom(from) {
  if (!from) return '';
  if (typeof from === 'string') return from;
  if (typeof from.text === 'string') return from.text;
  const premier = from.value && from.value[0];
  if (!premier) return '';
  return premier.name ? `${premier.name} <${premier.address}>` : premier.address || '';
}

function extraireAncres(html) {
  const resultat = [];
  const regex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    resultat.push({
      href: decoderEntites(match[1]),
      titre: htmlVersTexte(match[2]),
      index: match.index,
      fin: match.index + match[0].length,
    });
  }
  return resultat;
}

function urlsDansTexte(texte) {
  const resultat = [];
  const regex = /https?:\/\/[^\s<>"')\]]+/gi;
  let match;
  while ((match = regex.exec(texte))) {
    resultat.push(match[0].replace(/[.,;]+$/, ''));
  }
  return resultat;
}

function couperPiedDePage(texte) {
  const coupe = String(texte || '').split(/unsubscribe|se désinscrire|se desinscrire|gérer vos alertes|gerer vos alertes|voir toutes les offres/i)[0];
  return coupe.trim().slice(0, 600);
}

function titreUtile(titre, extrait, sujet) {
  const propre = String(titre || '').replace(/\s+/g, ' ').trim();
  if (propre && !TITRES_GENERIQUES.test(normaliser(propre))) return propre.slice(0, 180);
  const premiereLigne = String(extrait || '').split('\n').map((l) => l.trim()).find(Boolean);
  if (premiereLigne) return premiereLigne.slice(0, 180);
  return String(sujet || 'Offre sans titre').slice(0, 180);
}

function offreDeBase(mail, champs) {
  return {
    titre: champs.titre,
    lien: champs.lien || '',
    source: champs.lien ? classerSource(champs.lien) : 'Site carrière',
    extrait: champs.extrait || '',
    messageId: mail.id || mail.messageId || '',
    sujet: mail.subject || mail.sujet || '',
    dateMail: mail.date || mail.dateMail || '',
    expediteur: adresseFrom(mail.from),
  };
}

function decouperMail(mail) {
  const sujet = mail.subject || mail.sujet || '';
  const html = mail.html && mail.html !== true ? String(mail.html) : '';
  const texte = String(mail.text || '');
  const ancres = extraireAncres(html);
  const offres = [];
  const vus = new Set();

  const retenir = (lien, titre, extrait) => {
    const direct = lienDirect(lien);
    if (!estLienOffre(direct)) return;
    const cle = cleLien(direct);
    if (vus.has(cle)) return;
    vus.add(cle);
    offres.push(offreDeBase(mail, {
      titre: titreUtile(titre, extrait, sujet),
      lien: direct,
      extrait: couperPiedDePage(extrait),
    }));
  };

  if (ancres.length) {
    ancres.forEach((ancre, i) => {
      const suivant = ancres[i + 1];
      const tranche = html.slice(ancre.fin, suivant ? suivant.index : ancre.fin + 1200);
      const avant = html.slice(Math.max(0, ancre.index - 250), ancre.index);
      const extrait = htmlVersTexte(`${avant}\n${tranche}`);
      retenir(ancre.href, ancre.titre, extrait);
    });
  }

  if (!offres.length) {
    urlsDansTexte(`${html}\n${texte}`).forEach((url) => {
      retenir(url, '', texte.slice(0, 600));
    });
  }

  if (!offres.length) {
    offres.push(offreDeBase(mail, {
      titre: titreUtile('', texte, sujet),
      lien: '',
      extrait: couperPiedDePage(texte || htmlVersTexte(html)),
    }));
  }

  return offres;
}

module.exports = {
  classerSource,
  estLienOffre,
  decouperMail,
};
