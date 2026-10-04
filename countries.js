/* Preferencia explícita, sin ubicación por IP ni permisos de geolocalización. */
(() => {
 const markets={PE:'PEN',MX:'MXN',CO:'COP',CL:'CLP',AR:'ARS',BR:'BRL',BO:'BOB',EC:'USD',UY:'UYU',PY:'PYG',CR:'CRC',GT:'GTQ',HN:'HNL',DO:'DOP',PA:'USD',SV:'USD',US:'USD',CA:'CAD',GB:'GBP',ES:'EUR',FR:'EUR',DE:'EUR',PT:'EUR',CN:'CNY',JP:'JPY',RU:'RUB',OTHER:'USD'};
 const has=code=>Object.hasOwn(markets,code);
 function name(code){
  if(code==='OTHER')return window.TUPLUS_I18N?.t('Otro país')||'Otro país';
  try{return new Intl.DisplayNames([window.TUPLUS_I18N?.locale||document.documentElement.lang||'es'],{type:'region'}).of(code)}catch{return code}
 }
 window.TUPLUS_COUNTRIES={codes:Object.keys(markets),has,name,currency:code=>markets[code]||'PEN'};
})();
