(() => {
  const rows={es:['Explorar mi territorio','Ciudad','Región / provincia (opcional)','Llevaremos este territorio a tu postulación. La disponibilidad se confirma al evaluar tu solicitud.','Continuar con este territorio'],en:['Explore my territory','City','Region / province (optional)','We will carry this territory into your application. Availability is confirmed during review.','Continue with this territory'],pt:['Explorar meu território','Cidade','Região / província (opcional)','Levaremos este território para sua candidatura. A disponibilidade será confirmada na avaliação.','Continuar com este território'],fr:['Explorer mon territoire','Ville','Région / province (facultatif)','Ce territoire sera repris dans votre candidature. La disponibilité sera confirmée lors de l’évaluation.','Continuer avec ce territoire'],de:['Mein Gebiet erkunden','Stadt','Region / Provinz (optional)','Dieses Gebiet wird in Ihre Bewerbung übernommen. Die Verfügbarkeit wird bei der Prüfung bestätigt.','Mit diesem Gebiet fortfahren'],ja:['活動地域を探す','都市','地域・県（任意）','選択した地域を応募フォームに引き継ぎます。募集状況は審査時に確認されます。','この地域で続ける'],zh:['探索我的区域','城市','地区／省份（选填）','此区域将带入您的申请。名额情况将在审核时确认。','使用此区域继续'],ru:['Выбрать территорию','Город','Регион / область (необязательно)','Эта территория будет перенесена в заявку. Доступность подтверждается при рассмотрении.','Продолжить с этой территорией']};
  const keys=['explore','city','region','note','continue'];
  for(const [lang,row] of Object.entries(rows))row.forEach((v,i)=>window.TUPLUS_TRANSLATIONS[lang]['territory.'+keys[i]]=v);
  // Demonstration requested by the user; replace with approved availability before publishing.
  const states = {PE:'open',PT:'future',ES:'limited',JP:'future',US:'closed',DE:'unavailable'};
  const resolve = country => !country ? 'pending' : states[country] || 'unavailable';
  const canApply = (country,city) => Boolean(String(city || '').trim()) && ['open','limited'].includes(resolve(country));
  window.TUPLUS_TERRITORY = {resolve,canApply};
  const statusKeys=['open','limited','future','closed','unavailable','pending','openCopy','limitedCopy','futureCopy','closedCopy','unavailableCopy','pendingCopy','availability'];
  const statusRows={
    es:['Abierta','Cupos limitados','Futura','Cerrada','No disponible','Elige tu territorio','Puedes postularte ahora.','Quedan pocos cupos para iniciar una postulación.','Próximamente disponible. Por ahora no puedes postularte aquí.','No aceptamos más postulaciones en este territorio por el momento.','La Red todavía no está disponible para nuevas postulaciones en tu país o región.','Selecciona un país y escribe una ciudad para consultar su disponibilidad.','Disponibilidad territorial'],
    en:['Open','Limited places','Coming soon','Closed','Unavailable','Choose your territory','You can apply now.','Only a few places remain for applications.','Coming soon. Applications are not yet open here.','We are not accepting more applications in this territory at present.','New partner applications are not yet available in your country or region.','Select a country and enter a city to check availability.','Territory availability'],
    pt:['Aberta','Vagas limitadas','Futura','Fechada','Indisponível','Escolha seu território','Você pode se candidatar agora.','Restam poucas vagas para candidaturas.','Em breve. As candidaturas ainda não estão abertas aqui.','Não estamos aceitando mais candidaturas neste território no momento.','Novas candidaturas ainda não estão disponíveis em seu país ou região.','Selecione um país e informe uma cidade para consultar a disponibilidade.','Disponibilidade territorial'],
    fr:['Ouverte','Places limitées','À venir','Fermée','Indisponible','Choisissez votre territoire','Vous pouvez postuler maintenant.','Il reste peu de places pour les candidatures.','Prochainement. Les candidatures ne sont pas encore ouvertes ici.','Nous n’acceptons plus de candidatures dans ce territoire pour le moment.','Les nouvelles candidatures ne sont pas encore disponibles dans votre pays ou région.','Sélectionnez un pays et saisissez une ville pour consulter la disponibilité.','Disponibilité territoriale'],
    de:['Offen','Begrenzte Plätze','Demnächst','Geschlossen','Nicht verfügbar','Gebiet auswählen','Sie können sich jetzt bewerben.','Es sind nur noch wenige Bewerbungsplätze verfügbar.','Demnächst verfügbar. Hier sind noch keine Bewerbungen möglich.','Wir nehmen derzeit keine weiteren Bewerbungen in diesem Gebiet an.','Neue Bewerbungen sind in Ihrem Land oder Ihrer Region noch nicht möglich.','Wählen Sie ein Land und geben Sie eine Stadt ein, um die Verfügbarkeit zu prüfen.','Gebietsverfügbarkeit'],
    ja:['受付中','残り枠わずか','近日受付予定','受付終了','対象外','地域を選択','今すぐ応募できます。','応募枠が残りわずかです。','近日受付予定です。現在、この地域では応募できません。','現在、この地域では追加の応募を受け付けていません。','お住まいの国・地域では新規応募をまだ受け付けていません。','国を選択し、都市名を入力して受付状況を確認してください。','地域の受付状況'],
    zh:['开放申请','名额有限','即将开放','已关闭','暂不可用','选择区域','您现在可以申请。','剩余申请名额不多。','即将开放。目前此区域尚不能申请。','目前此区域不再接受更多申请。','您所在国家或地区尚未开放新的合作伙伴申请。','请选择国家并输入城市以查询开放情况。','区域申请状态'],
    ru:['Открыта','Мест мало','Скоро','Закрыта','Недоступна','Выберите территорию','Вы можете подать заявку сейчас.','Осталось мало мест для подачи заявок.','Скоро будет доступно. Пока здесь нельзя подать заявку.','Сейчас мы не принимаем новые заявки на этой территории.','Новые заявки пока недоступны в вашей стране или регионе.','Выберите страну и введите город, чтобы проверить доступность.','Доступность территории']
  };
  for(const [lang,row] of Object.entries(statusRows))row.forEach((v,i)=>window.TUPLUS_TRANSLATIONS[lang]['territory.status.'+statusKeys[i]]=v);
  const demoRows={es:['Vista de ejemplo · disponibilidad por confirmar','Elige dónde quieres crecer','Selecciona un país para ver su estado y el siguiente paso.','Tu territorio seleccionado','Completa tu ciudad para continuar','Ver territorios abiertos','Postularme en este territorio'],en:['Demo · availability to be confirmed','Choose where you want to grow','Choose a country to see its status and next step.','Your selected territory','Enter your city to continue','View open territories','Apply in this territory'],pt:['Demonstração · disponibilidade a confirmar','Escolha onde quer crescer','Selecione um país para ver o estado e o próximo passo.','Seu território selecionado','Informe sua cidade para continuar','Ver territórios abertos','Candidatar-me neste território'],fr:['Démonstration · disponibilité à confirmer','Choisissez où vous développer','Sélectionnez un pays pour voir son état et la prochaine étape.','Votre territoire sélectionné','Indiquez votre ville pour continuer','Voir les territoires ouverts','Postuler dans ce territoire'],de:['Demo · Verfügbarkeit noch zu bestätigen','Wählen Sie Ihr Wachstumsgebiet','Wählen Sie ein Land, um Status und nächsten Schritt zu sehen.','Ihr ausgewähltes Gebiet','Geben Sie Ihre Stadt ein, um fortzufahren','Offene Gebiete ansehen','In diesem Gebiet bewerben'],ja:['デモ・受付状況は未確定','活動したい地域を選ぶ','国を選択すると、受付状況と次の手順を確認できます。','選択中の地域','続けるには都市名を入力','受付中の地域を見る','この地域で応募する'],zh:['演示 · 开放情况待确认','选择您想发展的地区','选择国家，查看状态和下一步。','已选区域','输入城市以继续','查看开放区域','在此区域申请'],ru:['Демонстрация · доступность требует подтверждения','Выберите регион для развития','Выберите страну, чтобы узнать статус и следующий шаг.','Выбранная территория','Укажите город, чтобы продолжить','Посмотреть открытые территории','Подать заявку в этом регионе']};
  const demoKeys=['demo','choose','intro','selected','enterCity','viewOpen','apply'];
  for(const [lang,row] of Object.entries(demoRows))row.forEach((text,i)=>window.TUPLUS_TRANSLATIONS[lang]['territory.'+demoKeys[i]]=text);
  const text=(el,key)=>window.TUPLUS_I18N.setText(el,'territory.'+key);
  document.addEventListener('DOMContentLoaded',()=>{
    for(const form of document.querySelectorAll('#pp-territory-form,#partner-form')){
      const country=form.querySelector('[name=country]'),city=form.querySelector('[name=city]');
      if(!country || !city)continue;
      const isExplorer=form.id==='pp-territory-form';
      const block=document.createElement('div');block.className='territory-availability pa-wide';
      const demo=document.createElement('p');demo.className='territory-demo';text(demo,'demo');
      const heading=document.createElement('strong');heading.className='territory-selected-name';heading.setAttribute('translate','no');
      const live=document.createElement('div');live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
      const badge=document.createElement('span'),copy=document.createElement('p');badge.className='territory-availability-badge';live.append(badge,copy);
      block.append(demo,heading,live);
      country.closest('label').insertAdjacentElement('afterend',block);
      let cards,alternative;
      if(isExplorer){
        const catalog=document.createElement('section');catalog.className='territory-catalog';
        const title=document.createElement('h3'),intro=document.createElement('p');text(title,'choose');text(intro,'intro');
        cards=document.createElement('div');cards.className='territory-cards';cards.setAttribute('role','group');
        for(const [id,state] of Object.entries(states)){
          const button=document.createElement('button');button.type='button';button.className='territory-card';button.dataset.territory=id;button.dataset.state=state;
          const code=document.createElement('span'),name=document.createElement('strong'),status=document.createElement('span'),arrow=document.createElement('span');
          code.className='territory-country-symbol';code.textContent=id;code.setAttribute('translate','no');name.className='territory-card-name';name.setAttribute('translate','no');status.className='territory-card-status';text(status,'status.'+state);arrow.className='territory-card-check';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';button.append(code,name,status,arrow);
          button.addEventListener('click',()=>{country.value=id;country.dispatchEvent(new Event('change',{bubbles:true}));document.dispatchEvent(new CustomEvent('tuplus:country-select',{detail:{id}}));});cards.append(button);
        }
        catalog.append(title,intro,cards);form.insertAdjacentElement('beforebegin',catalog);
        alternative=document.createElement('button');alternative.type='button';alternative.className='territory-alternative';text(alternative,'viewOpen');alternative.addEventListener('click',()=>{const target=cards.querySelector('[data-territory="PE"]');target.click();target.focus();});block.append(alternative);
        form.querySelector('h3').setAttribute('data-i18n','territory.selected');text(form.querySelector('h3'),'selected');
      }
      let previous=country.value;
      const update=()=>{
        if(isExplorer && previous!==country.value){city.value='';form.querySelector('[name=region]').value='';previous=country.value;}
        const state=resolve(country.value);block.dataset.state=state;
        const locale=window.TUPLUS_I18N.locale,names=new Intl.DisplayNames([locale],{type:'region'});
        heading.textContent=!country.value?'':Object.hasOwn(states,country.value)?names.of(country.value):window.TUPLUS_I18N.t('application.57');
        text(badge,'status.'+state);text(copy,'status.'+state+'Copy');
        if(cards){
          for(const button of cards.children){button.setAttribute('aria-pressed',String(button.dataset.territory===country.value));button.querySelector('strong').textContent=names.of(button.dataset.territory);button.querySelector('.territory-card-check').textContent=button.dataset.territory===country.value?'✓':'↗';}
          const available=['open','limited'].includes(state),submit=form.querySelector('[type=submit]');
          submit.disabled=!canApply(country.value,city.value);submit.hidden=!available;alternative.hidden=available;
          text(submit.querySelector('span'),city.value.trim()?'apply':'enterCity');
          city.closest('label').hidden=!available;city.disabled=!available;
          const region=form.querySelector('[name=region]');region.closest('label').hidden=!available;region.disabled=!available;
        }
      };
      country.addEventListener('change',update);city.addEventListener('input',update);city.addEventListener('change',update);document.addEventListener('tuplus:language-change',update);update();
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.querySelector('#pp-territory-form');if(!form)return;
    const country=form.querySelector('[name=country]'),other=form.querySelector('[name=otherCountry]');
    country.addEventListener('change',()=>{const isOther=country.value==='other';other.disabled=!isOther;other.closest('label').hidden=!isOther;});
    form.addEventListener('submit',e=>{
      e.preventDefault();const city=form.querySelector('[name=city]'),region=form.querySelector('[name=region]');
      for(const el of [city,other]){el.setCustomValidity(!el.disabled&&!el.value.trim()?window.TUPLUS_I18N.t('application.56'):'');}
      if(!form.reportValidity())return;
      if(!canApply(country.value,city.value))return;
      const application=document.querySelector('#partner-form');
      const values={country:country.value,city:city.value.trim(),region:region.value.trim(),otherCountry:other.disabled?'':other.value.trim()};
      for(const [name,value] of Object.entries(values))application.querySelector('[name="'+name+'"]').value=value;
      application.querySelector('[name=country]').dispatchEvent(new Event('change',{bubbles:true}));
      const smooth=!matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.querySelector('#postulacion').scrollIntoView?.({behavior:smooth?'smooth':'auto'});
      application.querySelector('.pa-panel:not([hidden]) h2')?.focus({preventScroll:true});
    });
    form.addEventListener('input',e=>e.target.setCustomValidity?.(''));
  });
})();
