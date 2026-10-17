(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tt = v => (window.TUPLUS_I18N && window.TUPLUS_I18N.t && window.TUPLUS_I18N.t(v)) || v;
  const S = () => { try { return state; } catch { return null; } };
  const say = m => { try { toast(m); } catch { /* opcional */ } };

  /* ---------- Traducciones (es, en, zh, ru, pt, fr, ja, de) ---------- */
  const LANGS = ['es', 'en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];
  const LOCALES = { es: 'es-PE', en: 'en-US', zh: 'zh-CN', ru: 'ru-RU', pt: 'pt-BR', fr: 'fr-FR', ja: 'ja-JP', de: 'de-DE' };
  const lang = () => {
    const l = (document.documentElement.lang || 'es').toLowerCase().slice(0, 2);
    return LANGS.includes(l) ? l : 'es';
  };
  const D = {};
  const K = (k, ...v) => {
    D[k] = Object.fromEntries(LANGS.map((l, i) => [l, v[i]]));
  };
  const x = k => (D[k] && (D[k][lang()] || D[k].es)) || k;
  const applyI18n = () => $$('[data-xd]').forEach(el => {
    const v = x(el.dataset.xd);
    if (el.textContent !== v) el.textContent = v;
  });

  K('presetLabel', 'Paquetes rápidos', 'Quick packages', '快速套餐', 'Готовые пакеты', 'Pacotes rápidos', 'Forfaits rapides', 'クイックパッケージ', 'Schnellpakete');
  K('pkE', 'Esencial', 'Essential', '基础版', 'Базовый', 'Essencial', 'Essentiel', 'エッセンシャル', 'Essential');
  K('pkED', 'Landing con contacto directo', 'Landing page with direct contact', '带直接联系方式的落地页', 'Лендинг с прямой связью', 'Landing page com contato direto', 'Landing page avec contact direct', '直接連絡できるランディングページ', 'Landingpage mit direktem Kontakt');
  K('pkP', 'Profesional', 'Professional', '专业版', 'Профессиональный', 'Profissional', 'Professionnel', 'プロフェッショナル', 'Professionell');
  K('pkPD', 'Sitio de 6 páginas con SEO y analítica', '6-page site with SEO and analytics', '含 SEO 和数据分析的 6 页网站', 'Сайт из 6 страниц с SEO и аналитикой', 'Site de 6 páginas com SEO e análises', 'Site de 6 pages avec SEO et analytique', 'SEO・分析付きの6ページサイト', '6-Seiten-Website mit SEO und Analytics');
  K('pkC', 'Completo', 'Complete', '完整版', 'Полный', 'Completo', 'Complet', 'コンプリート', 'Komplett');
  K('pkCD', 'Tienda con pagos, blog y Cloud', 'Store with payments, blog and Cloud', '含支付、博客和云服务的网店', 'Магазин с оплатой, блогом и Cloud', 'Loja com pagamentos, blog e Cloud', 'Boutique avec paiements, blog et Cloud', '決済・ブログ・クラウド付きのショップ', 'Shop mit Zahlungen, Blog und Cloud');
  K('tagTop', 'Más elegido', 'Most popular', '最受欢迎', 'Самый популярный', 'Mais escolhido', 'Le plus choisi', '一番人気', 'Am beliebtesten');
  K('tagRec', 'Recomendado', 'Recommended', '推荐', 'Рекомендуем', 'Recomendado', 'Recommandé', 'おすすめ', 'Empfohlen');
  K('pkToast', 'Paquete aplicado. Puedes ajustarlo en los siguientes pasos.', 'Package applied. You can adjust it in the next steps.', '已应用套餐，您可以在后续步骤中调整。', 'Пакет применён. Его можно изменить на следующих шагах.', 'Pacote aplicado. Você pode ajustá-lo nas próximas etapas.', 'Forfait appliqué. Vous pouvez l’ajuster aux étapes suivantes.', 'パッケージを適用しました。次のステップで調整できます。', 'Paket übernommen. Sie können es in den nächsten Schritten anpassen.');
  K('copyLink', 'Copiar enlace', 'Copy link', '复制链接', 'Копировать ссылку', 'Copiar link', 'Copier le lien', 'リンクをコピー', 'Link kopieren');
  K('copied', 'Enlace copiado. Quien lo abra verá las mismas opciones.', 'Link copied. Whoever opens it will see the same options.', '链接已复制，打开的人将看到相同的选项。', 'Ссылка скопирована. Открывший её увидит те же параметры.', 'Link copiado. Quem abrir verá as mesmas opções.', 'Lien copié. Quiconque l’ouvre verra les mêmes options.', 'リンクをコピーしました。開いた人にも同じ内容が表示されます。', 'Link kopiert. Wer ihn öffnet, sieht dieselben Optionen.');
  K('pg1', 'página', 'page', '页', 'страница', 'página', 'page', 'ページ', 'Seite');
  K('pgN', 'páginas', 'pages', '页', 'страниц', 'páginas', 'pages', 'ページ', 'Seiten');
  K('fn1', 'función', 'feature', '项功能', 'функция', 'função', 'fonction', '機能', 'Funktion');
  K('fnN', 'funciones', 'features', '项功能', 'функций', 'funções', 'fonctions', '機能', 'Funktionen');

  K('t_whatsapp', 'Botón para que tus clientes te escriban en un toque.', 'A button so your customers can message you in one tap.', '让客户一键给您发消息的按钮。', 'Кнопка, чтобы клиенты могли написать вам в одно касание.', 'Botão para seus clientes falarem com você em um toque.', 'Un bouton pour que vos clients vous écrivent en un clic.', 'お客様がワンタップでメッセージを送れるボタン。', 'Ein Button, mit dem Kunden Ihnen mit einem Tipp schreiben.');
  K('t_forms', 'Formularios que llegan a tu correo con los datos ordenados.', 'Forms that reach your email with the data neatly organized.', '表单数据整理好后直接发到您的邮箱。', 'Формы, которые приходят на почту с аккуратно собранными данными.', 'Formulários que chegam ao seu e-mail com os dados organizados.', 'Des formulaires qui arrivent par e-mail, données bien ordonnées.', '整理されたデータがメールで届くフォーム。', 'Formulare, die geordnet per E-Mail bei Ihnen ankommen.');
  K('t_seo', 'Estructura y textos pensados para que Google te encuentre.', 'Structure and copy designed so Google can find you.', '为让谷歌更容易找到您而设计的结构与文案。', 'Структура и тексты, чтобы вас находил Google.', 'Estrutura e textos pensados para o Google encontrar você.', 'Structure et textes pensés pour que Google vous trouve.', 'Googleに見つけてもらうための構成と文章。', 'Struktur und Texte, damit Google Sie findet.');
  K('t_analytics', 'Mide visitas y clics para decidir con datos.', 'Measure visits and clicks to decide with data.', '统计访问和点击，用数据做决策。', 'Измеряйте визиты и клики, чтобы решать на основе данных.', 'Meça visitas e cliques para decidir com dados.', 'Mesurez visites et clics pour décider avec des données.', '訪問数とクリック数を測定し、データで判断。', 'Besuche und Klicks messen und datenbasiert entscheiden.');
  K('t_booking', 'Tus clientes piden cita o reserva desde la web.', 'Your customers book appointments from the site.', '客户可直接在网站预约。', 'Клиенты записываются или бронируют прямо на сайте.', 'Seus clientes agendam ou reservam pelo site.', 'Vos clients réservent directement depuis le site.', 'お客様がサイトから予約できます。', 'Ihre Kunden buchen Termine direkt über die Website.');
  K('t_multilingual', 'Tu web en más de un idioma, con selector.', 'Your site in more than one language, with a selector.', '网站支持多种语言，并带语言选择器。', 'Сайт на нескольких языках с переключателем.', 'Seu site em mais de um idioma, com seletor.', 'Votre site en plusieurs langues, avec sélecteur.', '言語切替付きの多言語サイト。', 'Ihre Website in mehreren Sprachen, mit Sprachwahl.');
  K('t_payments', 'Cobro con tarjeta o billetera dentro de tu web.', 'Card or wallet payments inside your site.', '在网站内用银行卡或电子钱包收款。', 'Оплата картой или кошельком прямо на сайте.', 'Cobrança com cartão ou carteira digital no site.', 'Paiement par carte ou portefeuille sur votre site.', 'サイト内でカード・ウォレット決済。', 'Zahlung per Karte oder Wallet direkt auf der Website.');
  K('t_blog', 'Publica artículos y novedades sin tocar código.', 'Publish articles and news without touching code.', '无需写代码即可发布文章和动态。', 'Публикуйте статьи и новости без кода.', 'Publique artigos e novidades sem mexer em código.', 'Publiez articles et actualités sans toucher au code.', 'コード不要で記事やお知らせを公開。', 'Artikel und News veröffentlichen, ohne Code anzufassen.');
  K('t_maps', 'Mapa con tu ubicación y cómo llegar.', 'Map with your location and directions.', '显示您的位置和路线的地图。', 'Карта с вашим адресом и маршрутом.', 'Mapa com sua localização e como chegar.', 'Carte avec votre adresse et l’itinéraire.', '所在地と道順を示す地図。', 'Karte mit Ihrem Standort und Anfahrt.');
  K('t_automation', 'Conectamos tu web con tus herramientas para ahorrar trabajo manual.', 'We connect your site to your tools to save manual work.', '将网站与您的工具连接，减少手动工作。', 'Соединяем сайт с вашими инструментами, чтобы сократить ручную работу.', 'Conectamos seu site às suas ferramentas para poupar trabalho manual.', 'Nous connectons votre site à vos outils pour gagner du temps.', 'サイトとツールを連携して手作業を減らします。', 'Wir verbinden Ihre Website mit Ihren Tools und sparen Handarbeit.');
  K('t_speed', 'Ajustes para que la web cargue más rápido en celular.', 'Tweaks so the site loads faster on mobile.', '优化设置，让网站在手机上加载更快。', 'Настройки, чтобы сайт быстрее загружался на телефоне.', 'Ajustes para o site carregar mais rápido no celular.', 'Réglages pour que le site charge plus vite sur mobile.', 'スマホでの表示を速くする調整。', 'Optimierungen für schnelleres Laden auf dem Handy.');
  K('t_security', 'Buenas prácticas para proteger tu web y tus datos.', 'Best practices to protect your site and your data.', '保护网站与数据的最佳实践。', 'Лучшие практики защиты сайта и данных.', 'Boas práticas para proteger seu site e seus dados.', 'Bonnes pratiques pour protéger votre site et vos données.', 'サイトとデータを守るためのベストプラクティス。', 'Bewährte Verfahren zum Schutz von Website und Daten.');

  K('propL', 'Propuesta', 'Proposal', '报价单', 'Предложение', 'Proposta', 'Proposition', '提案書', 'Angebot');
  K('issued', 'Emitida el', 'Issued on', '签发日期：', 'Дата выдачи:', 'Emitida em', 'Émise le', '発行日：', 'Ausgestellt am');
  K('valid', 'Válida hasta el', 'Valid until', '有效期至：', 'Действительно до:', 'Válida até', 'Valable jusqu’au', '有効期限：', 'Gültig bis');
  K('tr1', 'Sin compromiso', 'No commitment', '无需承诺', 'Без обязательств', 'Sem compromisso', 'Sans engagement', 'ご契約の義務なし', 'Unverbindlich');
  K('tr1d', 'Tu cotización no te obliga a nada.', 'Your quote doesn’t commit you to anything.', '报价不会让您承担任何义务。', 'Расчёт ни к чему вас не обязывает.', 'Sua cotação não obriga você a nada.', 'Votre devis ne vous engage à rien.', 'お見積りに契約の義務はありません。', 'Ihr Angebot verpflichtet Sie zu nichts.');
  K('tr2', 'Respuesta por WhatsApp', 'Reply via WhatsApp', '通过 WhatsApp 回复', 'Ответ в WhatsApp', 'Resposta pelo WhatsApp', 'Réponse par WhatsApp', 'WhatsAppで返信', 'Antwort per WhatsApp');
  K('tr2d', 'Te enviamos la propuesta por el mismo chat.', 'We send the proposal in the same chat.', '我们在同一对话中发送方案。', 'Отправим предложение в том же чате.', 'Enviamos a proposta no mesmo chat.', 'Nous envoyons la proposition dans le même chat.', '同じチャットで提案をお送りします。', 'Wir senden das Angebot im selben Chat.');
  K('tr3', 'Precio claro', 'Clear pricing', '价格透明', 'Понятная цена', 'Preço claro', 'Prix clair', '明確な価格', 'Klarer Preis');
  K('tr3d', 'El importe final se confirma contigo.', 'The final amount is confirmed with you.', '最终金额与您确认。', 'Итоговая сумма согласуется с вами.', 'O valor final é confirmado com você.', 'Le montant final est confirmé avec vous.', '最終金額はご相談のうえ確定します。', 'Der Endbetrag wird mit Ihnen abgestimmt.');
  K('mq1', 'SEO técnico', 'Technical SEO', '技术 SEO', 'Технический SEO', 'SEO técnico', 'SEO technique', 'テクニカルSEO', 'Technisches SEO');
  K('mq2', 'Soporte 30 días', '30-day support', '30 天支持', 'Поддержка 30 дней', 'Suporte de 30 dias', 'Support 30 jours', '30日サポート', '30 Tage Support');

  K('howK', 'Cómo funciona', 'How it works', '使用方式', 'Как это работает', 'Como funciona', 'Comment ça marche', 'ご利用の流れ', 'So funktioniert es');
  K('howH', 'Tu cotización en tres pasos.', 'Your quote in three steps.', '三步完成报价。', 'Ваш расчёт за три шага.', 'Sua cotação em três passos.', 'Votre devis en trois étapes.', '3ステップでお見積り。', 'Ihr Angebot in drei Schritten.');
  K('how1b', 'Configura tu proyecto', 'Set up your project', '配置您的项目', 'Настройте проект', 'Configure seu projeto', 'Configurez votre projet', 'プロジェクトを設定', 'Projekt konfigurieren');
  K('how1p', 'Elige el tipo de web, las páginas, las funciones y el acabado visual.', 'Choose the site type, pages, features and visual finish.', '选择网站类型、页数、功能和视觉风格。', 'Выберите тип сайта, страницы, функции и оформление.', 'Escolha o tipo de site, as páginas, as funções e o acabamento visual.', 'Choisissez le type de site, les pages, les fonctions et le style visuel.', 'サイトの種類、ページ数、機能、デザインを選びます。', 'Wählen Sie Website-Typ, Seiten, Funktionen und Design.');
  K('how2b', 'Mira el precio al instante', 'See the price instantly', '即时查看价格', 'Смотрите цену сразу', 'Veja o preço na hora', 'Voyez le prix instantanément', '価格をすぐに確認', 'Preis sofort sehen');
  K('how2p', 'El total se actualiza contigo, en tu moneda y con o sin IGV.', 'The total updates as you go, in your currency, with or without tax.', '总价随您的选择实时更新，使用您的货币，可含或不含税。', 'Итог обновляется вместе с вами — в вашей валюте, с налогом или без.', 'O total se atualiza com você, na sua moeda, com ou sem imposto.', 'Le total se met à jour avec vous, dans votre devise, avec ou sans taxe.', '合計は選択に合わせて更新され、ご希望の通貨で税込・税抜を切り替えられます。', 'Die Summe aktualisiert sich live, in Ihrer Währung, mit oder ohne Steuer.');
  K('how3b', 'Recibe tu propuesta', 'Get your proposal', '收到您的方案', 'Получите предложение', 'Receba sua proposta', 'Recevez votre proposition', '提案を受け取る', 'Angebot erhalten');
  K('how3p', 'Envía el resumen por WhatsApp y confirmamos contigo el alcance y el importe final.', 'Send the summary via WhatsApp and we confirm the scope and final amount with you.', '通过 WhatsApp 发送摘要，我们与您确认范围和最终金额。', 'Отправьте сводку в WhatsApp, и мы согласуем объём и итоговую сумму.', 'Envie o resumo pelo WhatsApp e confirmamos com você o escopo e o valor final.', 'Envoyez le résumé par WhatsApp et nous confirmons avec vous le périmètre et le montant final.', '概要をWhatsAppで送信いただければ、範囲と最終金額を確認します。', 'Senden Sie die Zusammenfassung per WhatsApp – wir klären Umfang und Endbetrag mit Ihnen.');

  K('faqK', 'Preguntas frecuentes', 'FAQ', '常见问题', 'Частые вопросы', 'Perguntas frequentes', 'Questions fréquentes', 'よくある質問', 'Häufige Fragen');
  K('faqH', 'Antes de cotizar.', 'Before you quote.', '报价之前。', 'Перед расчётом.', 'Antes de cotar.', 'Avant de demander un devis.', 'お見積りの前に。', 'Bevor Sie anfragen.');
  K('faq1q', '¿El precio que veo es el final?', 'Is the price I see the final one?', '我看到的价格是最终价格吗？', 'Это окончательная цена?', 'O preço que vejo é o final?', 'Le prix affiché est-il définitif ?', '表示される価格は最終ですか？', 'Ist der angezeigte Preis endgültig?');
  K('faq1a', 'Es una estimación orientativa. El importe final, los impuestos y el alcance se confirman contigo en la propuesta.', 'It is an estimate. The final amount, taxes and scope are confirmed with you in the proposal.', '这是参考估价。最终金额、税费和范围将在方案中与您确认。', 'Это ориентировочная оценка. Итоговая сумма, налоги и объём согласуются в предложении.', 'É uma estimativa orientativa. O valor final, os impostos e o escopo são confirmados com você na proposta.', 'C’est une estimation indicative. Le montant final, les taxes et le périmètre sont confirmés dans la proposition.', '参考見積りです。最終金額・税・範囲は提案時に確認します。', 'Es ist eine Schätzung. Endbetrag, Steuern und Umfang werden im Angebot mit Ihnen bestätigt.');
  K('faq2q', '¿Qué incluye el soporte?', 'What does support include?', '支持包含什么？', 'Что входит в поддержку?', 'O que inclui o suporte?', 'Que comprend le support ?', 'サポートには何が含まれますか？', 'Was beinhaltet der Support?');
  K('faq2a', 'Todas las webs incluyen 30 días de correcciones y acompañamiento después del lanzamiento. Puedes ampliarlo a 90 o 180 días en el paso 4.', 'Every site includes 30 days of fixes and guidance after launch. You can extend it to 90 or 180 days in step 4.', '所有网站在上线后均含 30 天的修正与支持，可在第 4 步延长至 90 或 180 天。', 'Любой сайт включает 30 дней правок и сопровождения после запуска. На шаге 4 можно продлить до 90 или 180 дней.', 'Todos os sites incluem 30 dias de correções e acompanhamento após o lançamento. Você pode ampliar para 90 ou 180 dias na etapa 4.', 'Chaque site inclut 30 jours de corrections et d’accompagnement après le lancement. Vous pouvez passer à 90 ou 180 jours à l’étape 4.', 'すべてのサイトに公開後30日間の修正・サポートが含まれます。ステップ4で90日または180日に延長できます。', 'Jede Website enthält 30 Tage Korrekturen und Begleitung nach dem Start. In Schritt 4 können Sie auf 90 oder 180 Tage verlängern.');
  K('faq3q', '¿Cuánto demora mi proyecto?', 'How long will my project take?', '我的项目需要多长时间？', 'Сколько займёт мой проект?', 'Quanto tempo leva meu projeto?', 'Combien de temps prendra mon projet ?', '制作にはどのくらいかかりますか？', 'Wie lange dauert mein Projekt?');
  K('faq3a', 'En el resumen de tu proyecto verás un plazo estimado en días hábiles. Con la entrega prioritaria se reduce cuando el alcance lo permite.', 'Your project summary shows an estimated time in business days. Priority delivery shortens it when the scope allows.', '项目摘要中会显示以工作日计的预计工期。范围允许时，优先交付可缩短工期。', 'В сводке проекта вы увидите ориентировочный срок в рабочих днях. Приоритетная сдача сокращает его, если позволяет объём.', 'No resumo do projeto você vê um prazo estimado em dias úteis. A entrega prioritária o reduz quando o escopo permite.', 'Le récapitulatif affiche un délai estimé en jours ouvrés. La livraison prioritaire le réduit quand le périmètre le permet.', 'プロジェクト概要に営業日ベースの目安が表示されます。範囲が許せば優先納品で短縮できます。', 'In der Projektübersicht sehen Sie die geschätzte Dauer in Werktagen. Priorisierte Lieferung verkürzt sie, wenn der Umfang es zulässt.');
  K('faq4q', '¿En qué moneda puedo cotizar?', 'Which currency can I quote in?', '可以用哪种货币报价？', 'В какой валюте можно рассчитать?', 'Em qual moeda posso cotar?', 'Dans quelle devise puis-je faire mon devis ?', 'どの通貨で見積もれますか？', 'In welcher Währung kann ich kalkulieren?');
  K('faq4a', 'Los precios base están en dólares y se muestran en la moneda de tu país, o en la que elijas. El tipo de cambio es solo de referencia.', 'Base prices are in US dollars and shown in your country’s currency, or the one you choose. The exchange rate is for reference only.', '基础价格以美元计，并以您所在国家或您选择的货币显示。汇率仅供参考。', 'Базовые цены в долларах и показываются в валюте вашей страны или выбранной вами. Курс — только справочный.', 'Os preços base são em dólares e aparecem na moeda do seu país, ou na que você escolher. A taxa de câmbio é apenas de referência.', 'Les prix de base sont en dollars et affichés dans la devise de votre pays, ou celle que vous choisissez. Le taux est indicatif.', '基本価格は米ドルで、お住まいの国または選択した通貨で表示されます。為替レートは参考値です。', 'Basispreise sind in US-Dollar und werden in der Währung Ihres Landes oder Ihrer Wahl angezeigt. Der Wechselkurs dient nur zur Orientierung.');
  K('faq5q', '¿Cómo pago?', 'How do I pay?', '如何付款？', 'Как оплатить?', 'Como pago?', 'Comment payer ?', '支払い方法は？', 'Wie bezahle ich?');
  K('faq5a', 'En el paso 5 verás las opciones de pago disponibles, y siempre puedes coordinar por WhatsApp. Confirmamos tu pago por el mismo chat.', 'In step 5 you will see the available payment options, and you can always arrange it via WhatsApp. We confirm your payment in the same chat.', '在第 5 步可看到可用的付款方式，也可随时通过 WhatsApp 协调。我们会在同一对话中确认付款。', 'На шаге 5 вы увидите доступные способы оплаты, а договориться можно и через WhatsApp. Оплату подтверждаем в том же чате.', 'Na etapa 5 você verá as opções de pagamento disponíveis e sempre pode combinar pelo WhatsApp. Confirmamos o pagamento no mesmo chat.', 'À l’étape 5, vous verrez les moyens de paiement disponibles, et vous pouvez toujours convenir par WhatsApp. Nous confirmons le paiement dans le même chat.', 'ステップ5で利用可能な支払い方法が表示され、WhatsAppでの調整も可能です。支払いは同じチャットで確認します。', 'In Schritt 5 sehen Sie die verfügbaren Zahlungsoptionen; Sie können auch jederzeit per WhatsApp klären. Die Zahlung bestätigen wir im selben Chat.');

  let reChips = () => {}, reProposal = () => {}, reHero = () => {};

  const onLang = () => {
    applyI18n();
    reChips();
    reProposal();
    reHero();
    const t = $('.xd-top');
    if (t) t.setAttribute('aria-label', x('toTop'));
  };

  /* 1. Barra de scroll dorada arriba de la página */
  function initScrollBar() {
    const b = document.createElement('div');
    b.className = 'xd-scroll';
    b.setAttribute('aria-hidden', 'true');
    document.body.appendChild(b);

    const f = () => {
      const h = document.documentElement;
      b.style.transform = `scaleX(${Math.max(0, Math.min(1, h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1)))})`;
    };

    addEventListener('scroll', f, { passive: true });
    addEventListener('resize', f);
    f();
  }

  /* 2. Colibrí sobre la barra de progreso */
  function initBird() {
    const row = $('.progress-row'), track = $('.progress-track'), fill = $('#progressFill');
    if (!row || !track || !fill) return;

    const bird = document.createElement('div');
    bird.className = 'xt-bird';
    bird.setAttribute('aria-hidden', 'true');
    bird.innerHTML = '<img src="colibri.png" alt="">';
    row.appendChild(bird);

    const place = () => {
      const pct = parseFloat(fill.style.width) || 0;
      bird.style.left = (track.offsetLeft + track.offsetWidth * pct / 100) + 'px';
    };

    new MutationObserver(place).observe(fill, { attributes: true, attributeFilter: ['style'] });
    addEventListener('resize', place);
    addEventListener('load', place);
    place();
  }

  /* 3. La línea dorada de los pasos se llena según el avance */
  function initStepsFill() {
    const steps = $('.steps');
    if (!steps) return;

    const upd = () => {
      const all = $$('.step', steps), i = Math.max(0, all.findIndex(s => s.classList.contains('active')));
      steps.style.setProperty('--xd-p', all.length > 1 ? (i / (all.length - 1)).toFixed(3) : 0);
    };

    new MutationObserver(upd).observe(steps, { attributes: true, subtree: true, attributeFilter: ['class'] });
    upd();
  }

  /* 4. El total "rueda" hacia el nuevo valor */
  const parse = t => {
    const m = /^(\D*?)(\d[\d.,\s\u00a0\u202f]*\d|\d)(\D*)$/.exec(t.trim());
    if (!m) return null;

    const uniq = [...new Set(m[2].replace(/\d/g, ''))];
    if (uniq.length > 1) return null;

    const sep = uniq[0] || '';
    if (sep && m[2].split(sep).slice(1).some(g => g.length !== 3)) return null;

    return { pre: m[1], suf: m[3], sep, n: parseInt(m[2].replace(/\D/g, ''), 10) };
  };

  const fmt = (n, sep) => sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n);

  function roll(el) {
    if (!el) return;

    let shown = el.textContent, raf = 0;

    new MutationObserver(() => {
      const next = el.textContent;
      if (next === shown) return;

      cancelAnimationFrame(raf);
      const a = parse(shown), b = parse(next);

      if (reduce || !a || !b || a.pre !== b.pre || a.suf !== b.suf || a.sep !== b.sep) {
        shown = next;
        return;
      }

      const t0 = performance.now();

      (function step(now) {
        const k = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - k, 3);
        const txt = k < 1 ? b.pre + fmt(Math.round(a.n + (b.n - a.n) * e), b.sep) + b.suf : next;
        shown = txt;
        if (el.textContent !== txt) el.textContent = txt;
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }

  /* 5. Inclinación 3D y luz dorada en las tarjetas */
  function initTilt() {
    if (reduce) return;

    const CARD = ':is(.choice-card,.toggle-card,.feature-card,.radio-card,.toggle-line)';
    let raf = 0;

    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;

      const c = e.target.closest && e.target.closest(CARD);
      if (!c) return;

      const cx = e.clientX, cy = e.clientY;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = c.getBoundingClientRect(), px = (cx - r.left) / r.width, py = (cy - r.top) / r.height;

        c.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    }, { passive: true });

    document.addEventListener('pointerout', e => {
      const c = e.target.closest && e.target.closest(CARD);
      if (c && !c.contains(e.relatedTarget)) {
        c.style.setProperty('--rx', '0deg');
        c.style.setProperty('--ry', '0deg');
      }
    });
  }

  /* 6. Destello dorado al llegar a la cotización final */
  function burst() {
    if (reduce) return;

    const cx = innerWidth / 2, cy = Math.min(innerHeight * .35, 300);

    for (let i = 0; i < 28; i++) {
      const s = document.createElement('i'), a = Math.random() * 6.283, d = 80 + Math.random() * 180;

      s.className = 'xt-spark';
      s.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function initBurst() {
    const v5 = $('.step-view[data-view="5"]');
    if (!v5) return;

    let was = v5.classList.contains('active');

    new MutationObserver(() => {
      const now = v5.classList.contains('active');
      if (now && !was) burst();
      was = now;
    }).observe(v5, { attributes: true, attributeFilter: ['class'] });
  }

  /* 7. Configuración: paquetes y enlaces (acciona los botones existentes) */
  function applyConfig(c) {
    const click = el => el && el.click();
    const q = (sel, v) => $(`${sel}="${CSS.escape(String(v))}"]`);

    click(q('#projectOptions .choice-card[data-key', c.p));

    const rg = $('#pagesRange');
    if (rg) {
      rg.value = Math.max(1, Math.min(20, Math.round(Number(c.g)) || 1));
      rg.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const want = Array.isArray(c.f) ? c.f : [];

    $$('.feature-card').forEach(b => {
      if (b.classList.contains('selected') !== want.includes(b.dataset.feature)) b.click();
    });

    click($(`.toggle-card[data-toggle="${c.c ? 'contentPro' : 'contentClient'}"]`));
    click(q('.radio-card[data-design', c.d));
    click(q('.radio-card[data-support', c.s));

    [['#rushToggle', c.r], ['#hostingToggle', c.h], ['#taxToggle', c.x]].forEach(([sel, v]) => {
      const el = $(sel);
      if (el && v !== undefined && el.classList.contains('active') !== !!v) el.click();
    });
  }

  const currentConfig = () => {
    const s = S();
    return {
      p: s.project,
      g: s.pages,
      f: [...s.features],
      d: s.design,
      s: s.support,
      r: +s.rush,
      h: +s.hosting,
      c: +s.contentPro,
      x: +s.tax
    };
  };

  const PRESETS = [
    { n: 'pkE', d: 'pkED', c: { p: 'landing', g: 1, f: ['whatsapp', 'forms'], d: 'clean', s: '30', r: 0, h: 0, c: 0 } },
    { n: 'pkP', d: 'pkPD', tag: 'tagTop', c: { p: 'website', g: 6, f: ['whatsapp', 'forms', 'seo', 'analytics'], d: 'custom', s: '90', r: 0, h: 0, c: 0 } },
    { n: 'pkC', d: 'pkCD', c: { p: 'ecommerce', g: 10, f: ['whatsapp', 'forms', 'seo', 'analytics', 'payments', 'blog'], d: 'premium', s: '180', r: 0, h: 1, c: 0 } }
  ];

  function initPresets() {
    const grid = $('#projectOptions');
    if (!grid) return;

    const box = document.createElement('div');
    box.className = 'xt-presets';
    box.innerHTML = '<div class="section-label" data-xd="presetLabel"></div><div class="xt-presets-grid">' +
      PRESETS.map((p, i) => `<button class="xt-preset" type="button" data-i="${i}"><b data-xd="${p.n}"></b><small data-xd="${p.d}"></small>${p.tag ? `<i class="xt-badge" data-xd="${p.tag}"></i>` : ''}</button>`).join('') + '</div>';

    grid.insertAdjacentElement('afterend', box);

    box.addEventListener('click', e => {
      const b = e.target.closest('.xt-preset');
      if (!b) return;

      applyConfig(PRESETS[+b.dataset.i].c);
      say(x('pkToast'));
    });
  }

  function fromHash() {
    const m = /^#q=(.+)$/.exec(location.hash);
    if (!m) return;

    try {
      applyConfig(JSON.parse(atob(decodeURIComponent(m[1]))));
    } catch {
      /* enlace inválido */
    }
  }

  /* 8. Resumen "Tu proyecto", IGV visible y copiar enlace */
  function initChips() {
    const row = $('.progress-row');
    if (!row) return;

    const bar = document.createElement('div');
    bar.className = 'xt-chips';
    row.insertAdjacentElement('afterend', bar);

    reChips = () => {
      const s = S();
      if (!s) return;

      try {
        const n = s.features.size;

        bar.innerHTML =
          `<span class="xt-chip"><b>${tt(catalog[s.project].label)}</b></span>` +
          `<span class="xt-chip">${s.pages} ${x(s.pages === 1 ? 'pg1' : 'pgN')}</span>` +
          `<span class="xt-chip">${n} ${x(n === 1 ? 'fn1' : 'fnN')}</span>` +
          `<span class="xt-chip">${tt(designs[s.design].label)}</span>` +
          `<span class="xt-chip">&#9201; ${deliveryDays()}</span>` +
          '<span class="xt-grow"></span>' +
          `<button class="xt-chip" type="button" data-xt="igv" aria-pressed="${!!s.tax}">${tt(s.tax ? 'CON IGV' : 'SIN IGV')}</button>` +
          `<button class="xt-chip" type="button" data-xt="copy">${x('copyLink')}</button>`;
      } catch {
        /* si cotizador.js cambia, el resumen simplemente no se muestra */
      }
    };

    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-xt]');
      if (!b) return;

      if (b.dataset.xt === 'igv') {
        const t = $('#taxToggle');
        if (t) t.click();
        return;
      }

      const url = location.href.split('#')[0] + '#q=' + encodeURIComponent(btoa(JSON.stringify(currentConfig())));
      const done = () => say(x('copied'));

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, () => prompt('URL:', url));
      } else {
        prompt('URL:', url);
      }
    });

    const later = () => setTimeout(reChips, 0);
    const form = $('#quoteForm');

    if (form) ['click', 'input', 'change'].forEach(ev => form.addEventListener(ev, later));

    const live = $('#liveTotal');
    if (live) new MutationObserver(later).observe(live, { childList: true, characterData: true, subtree: true });

    reChips();
  }

  /* 9. Etiquetas y tooltips "¿qué es esto?" */
  function initTips() {
    const addBadge = (sel, key) => {
      const el = $(sel);
      if (el && !el.querySelector('.xt-badge')) {
        const b = document.createElement('i');
        b.className = 'xt-badge';
        b.dataset.xd = key;
        el.appendChild(b);
      }
    };

    addBadge('#projectOptions .choice-card[data-key="website"]', 'tagTop');
    addBadge('.feature-card[data-feature="seo"]', 'tagRec');

    const tip = document.createElement('div');
    tip.className = 'xt-tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);

    const show = c => {
      const k = 't_' + c.dataset.feature;
      if (!D[k]) return;

      tip.textContent = x(k);
      const r = c.getBoundingClientRect();

      tip.style.left = Math.max(130, Math.min(innerWidth - 130, r.left + r.width / 2)) + 'px';
      tip.style.top = Math.max(60, r.top - 8) + 'px';
      tip.classList.add('on');
    };

    const hide = () => tip.classList.remove('on');

    document.addEventListener('pointerover', e => {
      if (e.pointerType === 'mouse') {
        const c = e.target.closest('.feature-card');
        if (c) show(c);
      }
    });

    document.addEventListener('pointerout', e => {
      if (e.target.closest && e.target.closest('.feature-card')) hide();
    });

    document.addEventListener('focusin', e => {
      const c = e.target.closest && e.target.closest('.feature-card');
      if (c) show(c);
    });

    document.addEventListener('focusout', hide);
    addEventListener('scroll', hide, { passive: true });
  }

  /* 10. Encabezado de propuesta (paso 5) y franja de confianza */
  function initProposal() {
    const grid = $('.summary-view .summary-grid');
    if (!grid) return;

    let no = '';

    try {
      no = localStorage.getItem('tuplusQuoteNo') || '';
    } catch {
      /* sin guardado */
    }

    if (!no) {
      no = 'TP-' + String(Date.now()).slice(-5);
      try {
        localStorage.setItem('tuplusQuoteNo', no);
      } catch {
        /* sin guardado */
      }
    }

    const box = document.createElement('div');
    box.className = 'xd-proposal';
    grid.insertAdjacentElement('beforebegin', box);

    const today = new Date(), until = new Date(today.getTime() + 15 * 864e5);

    reProposal = () => {
      const f = d => d.toLocaleDateString(LOCALES[lang()], {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      box.innerHTML = `<div><small>${x('propL')}</small><b>${no}</b></div><div class="xd-r">${x('issued')} ${f(today)}<br>${x('valid')} ${f(until)}</div>`;
    };

    reProposal();
  }

  function initTrust() {
    const form = $('#quoteForm');
    if (!form) return;

    const strip = document.createElement('div');
    strip.className = 'xd-trust';
    strip.innerHTML = [1, 2, 3].map(n => `<div><b data-xd="tr${n}"></b><small data-xd="tr${n}d"></small></div>`).join('');
    form.insertAdjacentElement('afterend', strip);
  }

  /* 11. Las secciones aparecen con suavidad al hacer scroll */
  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;

      e.target.classList.add('in');
      io.unobserve(e.target);

      setTimeout(() => {
        e.target.classList.remove('xd-rise', 'in');
        e.target.style.transitionDelay = '';
      }, 1400);
    }), { threshold: .12 });

    $$('.xd-how-grid li,.xd-faq details,.xd-trust>div,.xd-marquee,.xd-how>h2,.xd-faq>h2,.xd-cta-in').forEach((el, i) => {
      el.classList.add('xd-rise');
      el.style.transitionDelay = ((i % 3) * 90) + 'ms';
      io.observe(el);
    });
  }

  K('ctaH', '¿Listo para tener tu web?', 'Ready to get your website?', '准备好拥有您的网站了吗？', 'Готовы получить свой сайт?', 'Pronto para ter o seu site?', 'Prêt à lancer votre site ?', 'ウェブサイトを作る準備はできましたか？', 'Bereit für Ihre Website?');
  K('ctaP', 'Configura tu proyecto en un par de minutos y recibe una estimación clara.', 'Set up your project in a couple of minutes and get a clear estimate.', '几分钟即可配置项目，获得清晰的估价。', 'Настройте проект за пару минут и получите понятную оценку.', 'Configure seu projeto em poucos minutos e receba uma estimativa clara.', 'Configurez votre projet en quelques minutes et obtenez une estimation claire.', '数分でプロジェクトを設定し、明確な見積りを受け取れます。', 'Konfigurieren Sie Ihr Projekt in wenigen Minuten und erhalten Sie eine klare Schätzung.');
  K('ctaB', 'Empezar mi cotización', 'Start my quote', '开始我的报价', 'Начать расчёт', 'Começar minha cotação', 'Commencer mon devis', '見積りを始める', 'Meine Anfrage starten');
  K('toTop', 'Subir', 'Back to top', '回到顶部', 'Наверх', 'Voltar ao topo', 'Haut de page', 'トップへ', 'Nach oben');

  /* 12. Portada: bandera, monedas rápidas, calculadora, etiqueta de precio, polen y colibrí que te sigue */
  function initHero() {
    const ctl = $('.currency-control'), scene = $('.hummingbird-scene'), stage = $('#heroStage');
    const sel = $('#currencySelect'), cs = $('#countrySelect');

    let fxBox = null, calc = null, flag = null, badge = null;

    if (ctl && sel) {
      const codes = ['PEN', 'USD', 'EUR', 'MXN', 'COP', 'CLP', 'ARS', 'BRL', 'GBP', 'CAD']
        .filter(c => [...sel.options].some(o => o.value === c))
        .slice(0, 8);

      const copy = $('.currency-copy', ctl);

      fxBox = document.createElement('div');
      fxBox.className = 'xd-fx';
      fxBox.innerHTML = codes.map(c => `<button type="button" data-c="${c}">${c}</button>`).join('');

      (copy || ctl).insertAdjacentElement(copy ? 'beforebegin' : 'beforeend', fxBox);

      fxBox.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;

        sel.value = b.dataset.c;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      });

      calc = document.createElement('div');
      calc.className = 'xd-calc';
      (copy || ctl).insertAdjacentElement(copy ? 'afterend' : 'beforeend', calc);
    }

    const fm = cs && cs.closest('.market-field');

    if (fm) {
      flag = document.createElement('img');
      flag.className = 'xd-flag';
      flag.alt = '';
      flag.hidden = true;
      flag.addEventListener('error', () => {
        flag.hidden = true;
      });
      fm.appendChild(flag);
    }

    if (scene) {
      badge = document.createElement('div');
      badge.className = 'xd-pricebadge';
      badge.innerHTML = '<small></small><b></b><em></em>';
      scene.appendChild(badge);

      for (let i = 0; i < 14; i++) {
        const p = document.createElement('i');
        p.className = 'xd-pollen';
        p.style.cssText = `--x:${(8 + Math.random() * 84).toFixed(0)}%;--y:${(8 + Math.random() * 84).toFixed(0)}%;--s:${(3 + Math.random() * 4).toFixed(1)}px;--d:${(3 + Math.random() * 4).toFixed(1)}s`;
        scene.appendChild(p);
      }

      const orb = document.createElement('div');
      orb.className = 'xd-orbit2';
      orb.innerHTML = '<i></i><i></i><i></i>';
      scene.appendChild(orb);
    }

    reHero = () => {
      const s = S();
      if (!s) return;

      try {
        if (fxBox) $$('button', fxBox).forEach(b => b.classList.toggle('on', b.dataset.c === s.currency));
        if (calc) calc.textContent = '100 USD \u2248 ' + money(100);

        if (flag && s.country) {
          flag.src = `https://flagcdn.com/w40/${String(s.country).toLowerCase()}.png`;
          flag.hidden = false;
        }

        if (badge) {
          const live = $('#liveTotal');
          $('small', badge).textContent = tt('Estimado');
          $('b', badge).textContent = live ? live.textContent : '';
          $('em', badge).textContent = tt(s.tax ? 'CON IGV' : 'SIN IGV');
        }
      } catch {
        /* si cotizador.js cambia, la portada sigue funcionando */
      }
    };

    const rate = $('#currencyRate'), live = $('#liveTotal');

    [rate, live].forEach(el => {
      if (el) new MutationObserver(() => setTimeout(reHero, 0))
        .observe(el, { childList: true, characterData: true, subtree: true });
    });

    reHero();

    const bird = scene && $('.bird-core', scene);

    if (stage && bird && !reduce) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        bird.style.setProperty('--bx', (((e.clientX - r.left) / r.width - .5) * 26).toFixed(1) + 'px');
        bird.style.setProperty('--by', (((e.clientY - r.top) / r.height - .5) * 18).toFixed(1) + 'px');
      }, { passive: true });

      stage.addEventListener('pointerleave', () => {
        bird.style.setProperty('--bx', '0px');
        bird.style.setProperty('--by', '0px');
      });
    }
  }

  /* 13. Detecta el país del navegador la primera vez (se puede cambiar) */
  function initGeo() {
    try {
      if (localStorage.getItem('tuplusQuote')) return;
    } catch {
      return;
    }

    const cs = $('#countrySelect');
    const m = /-([A-Za-z]{2})$/.exec((navigator.languages && navigator.languages[0]) || navigator.language || '');

    if (!cs || !m) return;

    const code = m[1].toUpperCase();
    if (code === cs.value || ![...cs.options].some(o => o.value === code)) return;

    cs.value = code;
    cs.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* 14. Botón para volver arriba */
  function initTopBtn() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'xd-top';
    b.setAttribute('aria-label', x('toTop'));
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';

    b.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    document.body.appendChild(b);

    const f = () => b.classList.toggle('on', scrollY > 700);
    addEventListener('scroll', f, { passive: true });
    f();
  }

  function initLang() {
    document.addEventListener('tuplus:language-change', () => setTimeout(onLang, 0));

    new MutationObserver(onLang).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    const sel = $('#site-language');
    if (sel) sel.addEventListener('change', () => setTimeout(onLang, 80));
  }

  [
    initScrollBar,
    initBird,
    initStepsFill,
    () => {
      roll($('#liveTotal'));
      roll($('#totalPrice'));
    },
    initTilt,
    initBurst,
    initPresets,
    initChips,
    initTips,
    initProposal,
    initTrust,
    initHero,
    initTopBtn,
    initGeo,
    initReveal,
    applyI18n,
    initLang,
    fromHash
  ].forEach(f => {
    try {
      f();
    } catch (err) {
      console.warn('[cotizador-extras]', err);
    }
  });
})();