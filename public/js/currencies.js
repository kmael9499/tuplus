/* Referencias consultadas en Frankfurter el 25/09/2026. No son tarifas de cobro. */
(() => {
  const snapshot = {
    USD:[1,'2026-09-25'], PEN:[3.3923,'2026-09-24'], EUR:[.87695,'2026-09-24'],
    BRL:[5.1552,'2026-09-24'], MXN:[17.5335,'2026-09-24'], COP:[3280.54,'2026-09-25'],
    CLP:[961.7,'2026-09-24'], ARS:[1517.18,'2026-09-24'], UYU:[40.131,'2026-09-24'],
    BOB:[12.1449,'2026-09-24'], PYG:[5924,'2026-09-24'], CRC:[453.9,'2026-09-24'],
    GTQ:[7.6613,'2026-09-24'], DOP:[60.071,'2026-09-24'], HNL:[26.944,'2026-09-24'],
    CNY:[6.7078,'2026-09-24'], JPY:[158.23,'2026-09-24'], RUB:[84.64,'2026-09-24'],
    GBP:[.75348,'2026-09-24'], CAD:[1.4087,'2026-09-24']
  };
  const rates=Object.fromEntries(Object.entries(snapshot).map(([code,[rate,date]])=>[code,{rate,date}]));
  try{
    const saved=JSON.parse(localStorage.getItem('tuplus-rates')||'null');
    for(const code of Object.keys(rates)){
      const row=saved?.[code];
      if(row&&Number.isFinite(row.rate)&&row.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)&&row.date>rates[code].date&&row.date<=new Date().toISOString().slice(0,10)) rates[code]=row;
    }
  }catch{}
  rates.USD={rate:1,date:'2026-09-25'};
  const locale=()=>window.TUPLUS_I18N?.locale||document.documentElement.lang||'es';
  const name=code=>{try{return new Intl.DisplayNames([locale()],{type:'currency'}).of(code)}catch{return code}};
  const format=(usd,code)=>new Intl.NumberFormat(code==='PEN'?'es-PE':locale(),{style:'currency',currency:code,currencyDisplay:code==='PEN'?'symbol':'code',minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(usd*rates[code].rate));
  let pending=false;
  async function refresh(){
    if(pending)return false;
    pending=true;
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('https://api.frankfurter.dev/v2/rates?base=USD',{signal:controller.signal,referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error('rates');
      const data=await response.json();
      if(!Array.isArray(data))throw new Error('format');
      let count=0;
      for(const row of data){
        if(row.base==='USD'&&Object.hasOwn(rates,row.quote)&&row.quote!=='USD'&&Number.isFinite(row.rate)&&row.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)&&row.date>=rates[row.quote].date&&row.date<=new Date().toISOString().slice(0,10)){
          rates[row.quote]={rate:row.rate,date:row.date}; count++;
        }
      }
      if(!count)throw new Error('empty');
      try{localStorage.setItem('tuplus-rates',JSON.stringify(rates))}catch{}
      return true;
    }catch{return false}finally{clearTimeout(timer);pending=false}
  }
  window.TUPLUS_FX={rates,name,format,refresh};
})();
