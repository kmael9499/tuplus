// Complemento de contacto: se carga antes del motor de traducción.
(() => {
  const locales = ['en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];
  const rows = [
    ['05 / CONSTRUYAMOS LO QUE SIGUE', '05 / LET’S BUILD WHAT COMES NEXT', '05 / 共创未来', '05 / СОЗДАДИМ БУДУЩЕЕ ВМЕСТЕ', '05 / VAMOS CONSTRUIR O PRÓXIMO PASSO', '05 / CONSTRUISONS LA SUITE', '05 / 次の一歩を共につくろう', '05 / GESTALTEN WIR DEN NÄCHSTEN SCHRITT'],
    ['Selecciona tu país', 'Select your country', '请选择您的国家或地区', 'Выберите страну', 'Selecione seu país', 'Sélectionnez votre pays', '国・地域を選択してください', 'Wählen Sie Ihr Land'],
    ['Escribe un nombre de 2 a 80 caracteres, sin números ni símbolos especiales.', 'Enter a name of 2–80 characters, without numbers or special symbols.', '请输入2至80个字符的姓名，不含数字或特殊符号。', 'Введите имя длиной от 2 до 80 символов, без цифр и специальных знаков.', 'Digite um nome de 2 a 80 caracteres, sem números nem símbolos especiais.', 'Saisissez un nom de 2 à 80 caractères, sans chiffres ni symboles spéciaux.', '数字や特殊記号を使わず、2～80文字で名前を入力してください。', 'Geben Sie einen Namen mit 2–80 Zeichen ohne Zahlen oder Sonderzeichen ein.'],
    ['Escribe una empresa o actividad de 2 a 100 caracteres, con letras y puntuación habitual.', 'Enter a company or activity of 2–100 characters, using letters and standard punctuation.', '请输入2至100个字符的公司名称或业务，使用文字和常规标点。', 'Укажите компанию или деятельность: от 2 до 100 символов, с буквами и обычными знаками препинания.', 'Digite uma empresa ou atividade de 2 a 100 caracteres, com letras e pontuação habitual.', 'Indiquez une entreprise ou activité de 2 à 100 caractères, avec des lettres et une ponctuation courante.', '会社名または事業内容を、文字と一般的な句読点を使って2～100文字で入力してください。', 'Geben Sie ein Unternehmen oder eine Tätigkeit mit 2–100 Zeichen mit Buchstaben und üblicher Zeichensetzung ein.'],
    ['Describe tu proyecto en 20 a 1000 caracteres.', 'Describe your project in 20–1000 characters.', '请用20至1000个字符描述您的项目。', 'Опишите проект: от 20 до 1000 символов.', 'Descreva seu projeto em 20 a 1000 caracteres.', 'Décrivez votre projet en 20 à 1000 caractères.', 'プロジェクトを20～1000文字で説明してください。', 'Beschreiben Sie Ihr Projekt mit 20–1000 Zeichen.']
  ];
  for (const [source, ...translations] of rows) locales.forEach((locale, index) => {
    (window.TUPLUS_TRANSLATIONS[locale] ||= {})[source] = translations[index];
  });
})();
