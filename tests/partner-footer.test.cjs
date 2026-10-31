const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const script=fs.readFileSync('public/js/partner-footer.js','utf8');
for(const page of ['partner','red-socios']) {
  const {window}=parseHTML(fs.readFileSync('dist/'+page+'.html','utf8')),{document}=window;
  let intersection,preferenceChanged;
  const media={matches:false,addEventListener(_,fn){preferenceChanged=fn;}};
  const Observer=class {constructor(fn){intersection=fn;}observe(el){assert.ok(el.classList.contains('site-footer'));}};
  window.IntersectionObserver=Observer;
  const context=vm.createContext({window,document,matchMedia:()=>media,IntersectionObserver:Observer});
  vm.runInContext(script,context);
  const layer=document.querySelector('.partner-footer-particles');
  assert.equal(document.querySelectorAll('.partner-footer-particles').length,1);
  assert.ok(layer.closest('footer'));assert.equal(document.querySelector('main .partner-footer-particles'),null);
  assert.equal(layer.children.length,24);assert.equal(layer.getAttribute('aria-hidden'),'true');
  assert.equal(layer.dataset.running,'false');intersection([{isIntersecting:true}]);assert.equal(layer.dataset.running,'true');
  document.hidden=true;document.dispatchEvent(new window.Event('visibilitychange'));assert.equal(layer.dataset.running,'false');
  document.hidden=false;document.dispatchEvent(new window.Event('visibilitychange'));assert.equal(layer.dataset.running,'true');
  media.matches=true;preferenceChanged();assert.equal(layer.hidden,true);assert.equal(layer.dataset.running,'false');
  media.matches=false;preferenceChanged();assert.equal(layer.hidden,false);assert.equal(layer.dataset.running,'true');
  intersection([{isIntersecting:false}]);assert.equal(layer.dataset.running,'false');
  vm.runInContext(script,context);assert.equal(document.querySelectorAll('.partner-footer-particles').length,1);
  console.log('OK: '+page+' — particles only in footer, visibility pause, reduced motion, no duplicate layers.');
}
