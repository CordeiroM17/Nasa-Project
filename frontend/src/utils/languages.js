const langButtons = document.querySelectorAll('[data-language]');
const textsToChange = document.querySelectorAll('[data-section]');

export const applyTranslation = (lang) => {
  if (!lang) return;

  fetch(`src/languages/${lang}.json`)
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

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTranslation(button.dataset.language);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('selectedLanguage') || 'en'; // 'en' default

  const langButton = document.querySelector(`[data-language="${savedLang}"]`);
  if (langButton) {
    langButton.click();
  }
});
