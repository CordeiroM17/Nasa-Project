const langButtons = document.querySelectorAll('[data-language]');
const textsToChange = document.querySelectorAll('[data-section]');

export const applyTranslation = (lang) => {
  if (!lang) return Promise.resolve();

  fetch(`/languages/${lang}.json`)
    .then((res) => res.json())
    .then((data) => {
      textsToChange.forEach((element) => {
        const section = element.dataset.section;
        const value = element.dataset.value;
        if (data[section] && data[section][value]) {
          element.innerHTML = data[section][value];
        }
      });
    });
};

export const getSavedLanguage = () => {
  return localStorage.getItem('selectedLanguage') || 'en';
};

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedLang = button.dataset.language;
    localStorage.setItem('selectedLanguage', selectedLang);
    applyTranslation(selectedLang);
  });
});

// se ejecuta en la primera carga
/* document.addEventListener('DOMContentLoaded', () => {
  restoreLanguage();
}); */

// se ejecuta cada vez que Astro cambia de página
/* document.addEventListener('astro:after-swap', () => {
  restoreLanguage();
}); */

export function restoreLanguage() {
  const savedLang = localStorage.getItem('selectedLanguage') || 'en';
  applyTranslation(savedLang);
}
