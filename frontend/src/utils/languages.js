
export const applyTranslation = (lang) => {
  if (!lang) return Promise.resolve();
  const textsToChange = document.querySelectorAll('[data-section]');
  return fetch(`/languages/${lang}.json`)
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

export function restoreLanguage() {
  const savedLang = getSavedLanguage();
  applyTranslation(savedLang);
}

function setupLanguageListeners() {
  const langButtons = document.querySelectorAll('[data-language]');
  langButtons.forEach((button) => {
    button.onclick = () => {
      const selectedLang = button.dataset.language;
      localStorage.setItem('selectedLanguage', selectedLang);
      applyTranslation(selectedLang);
    };
  });
}

function reinitLanguage() {
  restoreLanguage();
  setupLanguageListeners();
}

document.addEventListener('DOMContentLoaded', reinitLanguage);
document.addEventListener('astro:after-swap', reinitLanguage);
