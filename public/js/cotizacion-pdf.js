/* Presentación del PDF; no calcula precios. */
(function () {
  const commercial = {
    conditions: 'Pago, revisiones y vigencia: por confirmar. Garantía: 30 días para defectos del alcance aprobado.',
    next: 'Confirmar el alcance, compartir materiales y coordinar el inicio.',
    external: 'Dominio, alojamiento, pasarelas y otros servicios de terceros: condiciones y cargos por confirmar.'
  };
  const clean = value => String(value || '').replace(/[\r\n\t]+/g, ' ').trim();
  const slug = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 45) || 'cliente';
  async function loadLogo() {
    const logo = document.querySelector('.brand-light');
    if (logo && !logo.complete) await new Promise(resolve => {
      logo.addEventListener('load', resolve, {once:true});
      logo.addEventListener('error', resolve, {once:true});
    });
    return logo;
  }
  function drawLogo(doc, logo) {
    doc.setFillColor(255,255,255).roundedRect(14,4,56,18,2.5,2.5,'F');
    if (logo && logo.naturalWidth) {
      try { doc.addImage(logo,'PNG',16,5,52,17); return; } catch (_) {}
    }
    doc.setFont('helvetica','bold').setFontSize(15).setTextColor(12,34,49).text('TUPLUS',42,15,{align:'center'});
  }
  async function download(q) {
    const PDF = window.jspdf && window.jspdf.jsPDF;
    if (!PDF) throw new Error('No está disponible la biblioteca PDF');
    const doc = new PDF({format:'a4', unit:'mm', compress:true});
    const ink=[28,52,67], muted=[94,109,117], gold=[211,177,107], dark=[18,44,61];
    let y=0;
    const logo=await loadLogo();
    function header() {
      doc.setFillColor(...dark).rect(0,0,210,25,'F');
      doc.setFillColor(...gold).rect(0,25,210,1.2,'F');
      drawLogo(doc, logo);
      doc.setFont('helvetica','normal').setFontSize(9).setTextColor(255,255,255).text('Tu siguiente paso digital',196,14,{align:'right'});
      y=34;
    }
    function footer() {
      doc.setFillColor(...dark).rect(0,287,210,10,'F');
      doc.setFont('helvetica','bold').setFontSize(9).setTextColor(255,255,255).text('www.tupluslatam.com',105,293,{align:'center'});
    }
    function ensure(height) { if(y+height>282){footer();doc.addPage();header();} }
    function paragraph(value, opts={}) {
      doc.setFont('helvetica',opts.bold?'bold':'normal').setFontSize(opts.size||9).setTextColor(...(opts.muted?muted:ink));
      const lines=doc.splitTextToSize(clean(value),opts.width||182);
      for (const line of lines) { ensure(5); doc.text(line,14,y); y+=4.5; }
      y+=opts.after===undefined?2:opts.after;
    }
    function section(title) {
      ensure(15); doc.setFillColor(240,239,233).roundedRect(14,y-4,182,8,2,2,'F');
      doc.setFillColor(...gold).rect(14,y-4,2,8,'F');
      doc.setTextColor(...ink).setFont('helvetica','bold').setFontSize(11).text(title,19,y+1); y+=9;
    }
    function row(label,value) {
      doc.setFont('helvetica','normal').setFontSize(9);
      const left=doc.splitTextToSize(clean(label),112), right=doc.splitTextToSize(clean(value),65);
      const height=Math.max(left.length,right.length)*4.5+3;
      ensure(height+1); doc.setTextColor(...ink); doc.text(left,16,y); doc.text(right,194,y,{align:'right'});
      y+=height; doc.setDrawColor(225,229,227).line(14,y-3,196,y-3);
    }
    header();
    paragraph('Cotización de '+q.service,{bold:true,size:19,after:4});
    paragraph('Cliente: '+q.client+(q.company?'   |   Empresa: '+q.company:''),{bold:true});
    if(q.email || q.phone) paragraph([q.email,q.phone].filter(Boolean).join('   |   '),{muted:true});
    paragraph('Fecha de emisión: '+q.date+'   |   Moneda: '+q.currency,{muted:true,after:4});
    section('Alcance');
    paragraph(q.scope+' Plan '+q.plan+'.');
    if(q.project==='ecommerce') paragraph('Incluye carrito, proceso de compra y una pasarela estándar. Los cargos y requisitos del proveedor se confirman por separado.');
    if(q.project==='webapp') paragraph('Desarrollo a medida; módulos, infraestructura y suscripciones sujetos al alcance acordado.');
    if(q.project==='catalog') paragraph('Compra y pago online sujetos a las opciones seleccionadas y a la confirmación del alcance.');
    section('Especificaciones y conceptos');
    q.rows.forEach(([label,value])=>row(label,value));
    row('Plazo estimado',q.delivery);
    if(q.pending.items.length){
      section('Adicionales por confirmar · no incluidos');
      q.pending.items.forEach(i=>row(i.label, i.range[1]==null ? 'Desde '+q.format(q.taxAmount(i.range[0])) : q.format(q.taxAmount(i.range[0]))+' - '+q.format(q.taxAmount(i.range[1]))));
    }
    if(q.recurring.length){ section('Costos recurrentes'); q.recurring.forEach(r=>row(r.label,r.text));
      if(q.support) paragraph('El primer mes de soporte está incluido en el total; los meses siguientes son recurrentes.',{muted:true});
      if(q.hosting) paragraph('Hosting y dominio anual se indican aparte del total.',{muted:true});
    }
    ensure(36); section('Inversión estimada');
    row(q.tax?'Base después del descuento':'Subtotal después del descuento',q.currency+' '+q.base);
    if(q.tax) row('IGV 18%',q.currency+' '+q.tax); else paragraph('IGV no incluido.',{muted:true});
    ensure(15); doc.setFillColor(...dark).roundedRect(14,y-3,182,12,2,2,'F'); doc.setFillColor(...gold).rect(14,y-3,2,12,'F');
    doc.setFont('helvetica','bold').setFontSize(12).setTextColor(255,255,255).text('TOTAL ESTIMADO',19,y+5);
    doc.text(q.currency+' '+q.total,191,y+5,{align:'right'}); y+=17;
    section('Fases del proyecto');
    paragraph('01  Planificación y diseño   ·   02  Desarrollo o configuración');
    paragraph('03  Pruebas y revisión   ·   04  Publicación o entrega');
    section('Condiciones y próximos pasos');
    paragraph(commercial.conditions); paragraph(commercial.external); paragraph(commercial.next);
    paragraph('Estimación orientativa; alcance y precio final sujetos a confirmación.',{muted:true});
    footer();
    doc.save('Cotizacion_TUPLUS_'+slug(q.service)+'_'+slug(q.client)+'_'+q.date.split('/').reverse().join('-')+'.pdf');
  }
  window.TuplusQuotePdf={download, loadLogo, drawLogo};
})();
