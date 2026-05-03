# Pages légales — Body by you

Ce dossier contient les pages publiques que GitHub Pages sert pour Body by you :

- `index.html` — landing avec liens
- `privacy.html` — politique de confidentialité (RGPD)
- `terms.html` — conditions générales d'utilisation
- `styles.css` — styles partagés (palette BBY)

## Activer GitHub Pages

1. Va sur https://github.com/shaicoachingisrael-stack/bby-app/settings/pages
2. **Source** : `Deploy from a branch`
3. **Branch** : `main`, **folder** : `/docs`
4. **Save**
5. Attends 1–2 min. URL publique :
   ```
   https://shaicoachingisrael-stack.github.io/bby-app/
   ```

> ⚠️ Si le repo est privé, GitHub Pages requiert un plan **Pro / Team / Enterprise** pour servir un site. Sinon, soit passer le repo public, soit déployer ailleurs (Vercel, Netlify, Cloudflare Pages — tous gratuits).

## URLs finales (à donner à App Store Connect)

- Privacy Policy : `https://shaicoachingisrael-stack.github.io/bby-app/privacy.html`
- Terms of Service : `https://shaicoachingisrael-stack.github.io/bby-app/terms.html`

## Placeholders à remplacer avant publication

Cherche-remplace dans `index.html`, `privacy.html`, `terms.html` :

| Placeholder | À remplir avec |
|---|---|
| `{{COMPANY_NAME}}` | Raison sociale (ex: « Shai Coaching SAS ») |
| `{{COMPANY_LEGAL_FORM}}` | Forme juridique (SAS, SARL, EI…) |
| `{{COMPANY_CAPITAL}}` | Capital social (ex: « 1 000 € ») |
| `{{COMPANY_ADDRESS}}` | Adresse complète du siège |
| `{{COMPANY_RCS}}` | Numéro RCS / SIREN |
| `{{COMPANY_RCS_CITY}}` | Ville du RCS (ex: « Paris ») |
| `{{COMPANY_DIRECTOR}}` | Directeur·rice de la publication |
| `{{CONTACT_EMAIL}}` | Email de contact (ex: contact@shaicoaching.com) |
| `{{LAST_UPDATED}}` | Date dernière mise à jour (ex: « 5 mai 2026 ») |
| `{{GOVERNING_LAW}}` | Loi applicable (ex: « français » ou « israélien ») |

## Process pour publier une mise à jour

1. Modifier les fichiers HTML
2. Commit + push sur `main`
3. GitHub Pages se redéploie automatiquement en 1–2 min

## Avertissement juridique

Ces documents sont des **templates** rédigés à partir de standards courants pour applications de coaching/wellness. **Faire valider par un avocat spécialisé** avant la publication officielle, en particulier les sections santé (avertissements), AI (Coach IA), et clauses Apple/Google.
