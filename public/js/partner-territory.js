(() => {
  const rows={es:['Explorar mi territorio','Ciudad','Región / provincia (opcional)','Llevaremos este territorio a tu postulación. La disponibilidad se confirma al evaluar tu solicitud.','Continuar con este territorio'],en:['Explore my territory','City','Region / province (optional)','We will carry this territory into your application. Availability is confirmed during review.','Continue with this territory'],pt:['Explorar meu território','Cidade','Região / província (opcional)','Levaremos este território para sua candidatura. A disponibilidade será confirmada na avaliação.','Continuar com este território'],fr:['Explorer mon territoire','Ville','Région / province (facultatif)','Ce territoire sera repris dans votre candidature. La disponibilité sera confirmée lors de l’évaluation.','Continuer avec ce territoire'],de:['Mein Gebiet erkunden','Stadt','Region / Provinz (optional)','Dieses Gebiet wird in Ihre Bewerbung übernommen. Die Verfügbarkeit wird bei der Prüfung bestätigt.','Mit diesem Gebiet fortfahren'],ja:['活動地域を探す','都市','地域・県（任意）','選択した地域を応募フォームに引き継ぎます。募集状況は審査時に確認されます。','この地域で続ける'],zh:['探索我的区域','城市','地区／省份（选填）','此区域将带入您的申请。名额情况将在审核时确认。','使用此区域继续'],ru:['Выбрать территорию','Город','Регион / область (необязательно)','Эта территория будет перенесена в заявку. Доступность подтверждается при рассмотрении.','Продолжить с этой территорией']};
  const keys=['explore','city','region','note','continue'];
  for(const [lang,row] of Object.entries(rows))row.forEach((v,i)=>window.TUPLUS_TRANSLATIONS[lang]['territory.'+keys[i]]=v);
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.querySelector('#pp-territory-form');if(!form)return;
    const country=form.querySelector('[name=country]'),other=form.querySelector('[name=otherCountry]');
    country.addEventListener('change',()=>{const isOther=country.value==='other';other.disabled=!isOther;other.closest('label').hidden=!isOther;});
    form.addEventListener('submit',e=>{
      e.preventDefault();const city=form.querySelector('[name=city]'),region=form.querySelector('[name=region]');
      for(const el of [city,other]){el.setCustomValidity(!el.disabled&&!el.value.trim()?window.TUPLUS_I18N.t('application.56'):'');}
      if(!form.reportValidity())return;
      const params=new URLSearchParams({country:country.value,city:city.value.trim(),region:region.value.trim()});
      if(!other.disabled)params.set('otherCountry',other.value.trim());
      location.href='red-socios.html?'+params.toString()+'#postulacion';
    });
    form.addEventListener('input',e=>e.target.setCustomValidity?.(''));
  });
})();
