import {gameOptions,defaultSettings,launchProgress,launchCountdown,validateEntry,internationalPhone} from './waitlist-model.js';
import {createPlayerPass} from './player-pass.js';
let settings={...defaultSettings},clockOffset=0,closed=false;
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const waitlist=q('#waitlist-dialog'),terms=q('#terms-dialog'),countryDialog=q('#country-dialog'),gameDialog=q('#game-dialog'),form=q('#waitlist-form');
const playerPass=createPlayerPass(q('[data-success-view]'));
let selectedCountry={id:'IN',name:'India',dial:'+91'},countries=[selectedCountry];
const dialogMotion=new WeakMap(),closingDialogs=new WeakSet();
const motionDuration=duration=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused')?1:duration;
function openDialog(dialog){
  if(dialog.open)return;dialog.classList.remove('is-closing');dialog.showModal();document.body.classList.add('dialog-open');
  dialogMotion.set(dialog,dialog.animate([{opacity:0,transform:'translateY(20px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:motionDuration(420),easing:'cubic-bezier(.18,.85,.25,1)'}));
}
async function closeDialog(dialog){
  if(!dialog.open||closingDialogs.has(dialog))return;closingDialogs.add(dialog);
  const current=getComputedStyle(dialog),from={opacity:current.opacity,transform:current.transform};dialogMotion.get(dialog)?.cancel();dialog.classList.add('is-closing');
  const animation=dialog.animate([from,{opacity:0,transform:'translateY(14px) scale(.975)'}],{duration:motionDuration(240),easing:'cubic-bezier(.4,0,.7,.25)',fill:'forwards'});dialogMotion.set(dialog,animation);
  await animation.finished.catch(()=>{});dialog.close();animation.cancel();dialog.classList.remove('is-closing');closingDialogs.delete(dialog);
}
const dateFormat=new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
function termsMarkup(){return `<ul><li>Free entry. One entry per person. Your details and player ID must be valid.</li><li>${settings.winnerCount} eligible players will be selected at random to receive P Coins. Joining does not guarantee a reward.</li><li>One Instagram story tagging @playpausein can earn one additional entry per person after manual verification. Winners are distinct people drawn at random from base and verified bonus entries. Sharing alone does not confirm a bonus entry.</li><li>Awarded P Coins expire ${settings.expiryDays} days after they are credited. They can be used on eligible PlayPause purchases after launch and cannot be exchanged for cash.</li><li>Winners will be contacted using the details submitted. Account verification may be required before crediting a reward.</li></ul><h3>Your details, your privacy.</h3><p>PlayPause collects your name, game, player ID, phone number and email to manage the waitlist, send launch updates and contact selected winners. Your entry is not permission for unrelated marketing.</p><p>To correct or remove your entry, contact <a href="mailto:admin@playpause.in">admin@playpause.in</a>. Keep your game password private; this form never asks for it.</p>`;}
function renderSettings(){
  const headline=q('#launch-title'),lines=settings.headline.split('\n');headline.replaceChildren();
  lines.forEach((line,i)=>{if(i)headline.append(document.createTextNode(' '),document.createElement('br'));const span=document.createElement('span');span.textContent=line;if(i===0)span.className='first-line';headline.append(span);});
  q('.launch-progress').setAttribute('aria-label',`Loading PlayPause for ${dateFormat.format(new Date(settings.launchAt))}`);
  qa('[data-winner-count]').forEach(el=>el.textContent=String(settings.winnerCount));
  q('[data-terms-content]').innerHTML=termsMarkup();q('[data-inline-terms-panel]').innerHTML=termsMarkup();
  tick();
}
function tick(){
  const now=Date.now()+clockOffset,percent=launchProgress(settings,now),progress=q('.launch-progress');
  renderCountdown(now);
  if(progress.getAttribute('aria-valuenow')!==String(percent)||!progress.dataset.ready){
    progress.dataset.ready='true';progress.setAttribute('aria-valuenow',String(percent));progress.setAttribute('aria-valuetext',`${percent}% of the way to launch`);
    q('[data-launch-percent]').textContent=String(percent);q('[data-logo-fill]').setAttribute('width',String(640*percent/100));q('[data-progress-track]').setAttribute('stroke-dashoffset',String(1-percent/100));q('[data-progress-tip]').setAttribute('cx',String(4+252*percent/100));progress.dataset.complete=String(percent===100);
  }
  if(now>=Date.parse(settings.launchAt)&&!closed){closed=true;q('[data-open-waitlist]').disabled=true;q('[data-open-waitlist]').textContent='Waitlist closed';q('#launch-title').textContent='The next chapter starts now.';q('[data-progress-label]').textContent='Ready to play';}
}
function renderCountdown(now=Date.now()+clockOffset){
  if(document.hidden||q('dialog[open]'))return;
  const timer=q('[data-launch-countdown]'),parts=launchCountdown(settings,now),ready=now>=Date.parse(settings.launchAt);
  for(const [unit,value]of Object.entries(parts)){
    const node=q(`[data-time-unit="${unit}"]`),text=String(value).padStart(2,'0');
    if(node.dataset.value===text)continue;
    const animate=Boolean(timer.dataset.ready)&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('motion-paused');
    rollCountdownDigits(node,text,animate);
  }
  const label=`${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, ${parts.seconds} seconds until PlayPause launches`;
  if(timer.getAttribute('aria-label')!==label)timer.setAttribute('aria-label',label);
  q('[data-countdown-label]').textContent=ready?'Ready to play':'Unpausing in';timer.dataset.ready='true';
}
function rollCountdownDigits(node,text,animate){
  node.dataset.value=text;node.setAttribute('aria-label',text);
  if(node.children.length!==text.length){node.replaceChildren(...[...text].map(digit=>{const column=document.createElement('span'),face=document.createElement('span');column.className='countdown-digit';column.setAttribute('aria-hidden','true');face.textContent=digit;column.append(face);return column;}));return;}
  [...text].forEach((digit,index)=>{
    const column=node.children[index],previous=column.lastElementChild;
    if(previous.textContent===digit)return;
    for(const face of [...column.children].slice(0,-1))face.remove();
    previous.getAnimations().forEach(animation=>animation.cancel());
    const next=document.createElement('span');next.textContent=digit;
    if(!animate){column.replaceChildren(next);return;}
    column.append(next);const motion={duration:640,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'};
    previous.animate([{transform:'translateY(0)'},{transform:'translateY(-110%)'}],motion);
    const incoming=next.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],motion);
    incoming.finished.then(()=>{if(next.parentElement===column){previous.remove();incoming.cancel();}}).catch(()=>{});
  });
}
async function loadSettings(){
  try{const response=await fetch('https://playpause-waitlist.vercel.app/api/config',{cache:'no-store'});if(!response.ok)return;const data=await response.json();
    if(data.settings)settings={...defaultSettings,...data.settings};
    if(Number.isFinite(data.now))clockOffset=data.now-Date.now();
    if(data.localEditor){
      const link=document.createElement('a');link.href='/studio';link.textContent='Edit preview';link.className='local-editor-link';q('.site-footer>div').prepend(link);
      if(new URLSearchParams(location.search).get('preview')==='player-pass'){
        q('[data-form-view]').hidden=true;q('[data-success-view]').hidden=false;waitlist.setAttribute('aria-labelledby','success-heading');const heading=q('[data-success-view] h2');heading.id='success-heading';heading.textContent='Player Pass preview';openDialog(waitlist);
        await playerPass.show({name:'Player One',game:'mobile-legends',gameName:'Mobile Legends',winnerCount:settings.winnerCount});
      }
    }
    renderSettings();
  }catch{/* The composition and countdown remain available when offline. */}
}
const select=form.elements.game,gameTrigger=q('#game-trigger'),gameMenu=q('#game-list');
let gameMenuOpen=false;
for(const [id,name]of gameOptions){
  const option=document.createElement('button');option.type='button';option.className='game-option';option.dataset.value=id;option.dataset.label=name;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;
  const art=document.createElement('img');art.className='game-option-art';art.loading='lazy';art.decoding='async';art.src=id==='other'?'/assets/brand/playpause-mark-night.svg':`/assets/launch/${id}.webp`;art.alt='';art.width=40;art.height=40;
  const label=document.createElement('span');label.textContent=name;option.append(art,label);
  const check=document.createElement('span');check.className='game-option-check';check.textContent='✓';check.setAttribute('aria-hidden','true');option.append(check);
  option.addEventListener('click',()=>chooseGame(id,name));gameMenu.append(option);
}
function openGameMenu(){
  if(gameMenuOpen)return;gameMenuOpen=true;gameTrigger.setAttribute('aria-expanded','true');q('#game-search').value='';for(const option of gameMenu.children)option.hidden=false;openDialog(gameDialog);gameMenu.scrollTop=0;
}
async function closeGameMenu({restoreFocus=false,immediate=false}={}){
  if(!gameDialog.open)return;gameMenuOpen=false;gameTrigger.setAttribute('aria-expanded','false');if(immediate)gameDialog.close();else await closeDialog(gameDialog);if(restoreFocus)gameTrigger.focus({preventScroll:true});
}
async function chooseGame(id,name){
  select.value=id;q('#game-selected').textContent=name;gameTrigger.classList.add('has-value');gameTrigger.removeAttribute('aria-invalid');q('[data-error="game"]').textContent='';
  for(const option of gameMenu.children)option.setAttribute('aria-selected',String(option.dataset.value===id));
  const other=id==='other';q('[data-other-game]').hidden=!other;form.elements.otherGame.disabled=!other;form.elements.otherGame.required=other;
  const searched=q('#game-search').value.trim();if(other&&searched&&!gameOptions.some(([key,label])=>key!=='other'&&label.toLowerCase().includes(searched.toLowerCase()))&&searched.toLowerCase()!=='other')form.elements.otherGame.value=searched;
  await closeGameMenu({restoreFocus:!other});if(other)form.elements.otherGame.focus();
}
gameTrigger.addEventListener('click',()=>gameMenuOpen?closeGameMenu({restoreFocus:true}):openGameMenu());
gameTrigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();openGameMenu();if(event.key==='End')gameMenu.lastElementChild.focus();}});
gameMenu.addEventListener('keydown',event=>{
  const options=[...gameMenu.children].filter(option=>!option.hidden),index=options.indexOf(document.activeElement);let next;
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeGameMenu({restoreFocus:true});return;}
  if(event.key==='ArrowDown')next=(index+1)%options.length;if(event.key==='ArrowUp')next=(index-1+options.length)%options.length;if(event.key==='Home')next=0;if(event.key==='End')next=options.length-1;
  if(next!==undefined){event.preventDefault();options[next].focus();}
  else if(event.key.length===1&&/\w/.test(event.key)){const match=options.find((option,i)=>i>index&&option.dataset.label.toLowerCase().startsWith(event.key.toLowerCase()))||options.find(option=>option.dataset.label.toLowerCase().startsWith(event.key.toLowerCase()));if(match){event.preventDefault();match.focus();}}
});
q('#game-search').addEventListener('input',event=>{const term=event.target.value.trim().toLowerCase();let matches=0;for(const option of gameMenu.children){option.hidden=!option.dataset.label.toLowerCase().includes(term);if(!option.hidden&&option.dataset.value!=='other')matches++;}if(!matches)gameMenu.querySelector('[data-value="other"]').hidden=false;gameMenu.scrollTop=0;});
q('#game-search').addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();gameMenu.querySelector('.game-option:not([hidden])')?.focus();}});
qa('[data-open-waitlist]').forEach(button=>button.addEventListener('click',()=>{if(!closed)openDialog(waitlist);}));
qa('[data-open-terms]').forEach(button=>button.addEventListener('click',()=>openDialog(terms)));
qa('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>closeDialog(button.closest('dialog'))));
for(const dialog of [waitlist,terms,countryDialog,gameDialog]){
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});
  dialog.addEventListener('close',()=>{if(dialog===gameDialog){gameMenuOpen=false;gameTrigger.setAttribute('aria-expanded','false');}if(!q('dialog[open]'))document.body.classList.remove('dialog-open');});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
}
function renderCountries(query=''){
  const fragment=document.createDocumentFragment(),term=query.trim().toLowerCase();
  for(const country of countries.filter(item=>`${item.name} ${item.id} ${item.dial}`.toLowerCase().includes(term))){
    const button=document.createElement('button');button.type='button';button.className='country-option';button.setAttribute('aria-pressed',String(country.id===selectedCountry.id));
    const name=document.createElement('span');name.textContent=country.name;const dial=document.createElement('span');dial.className='country-dial';dial.textContent=country.dial;button.append(name,dial);
    button.addEventListener('click',async()=>{selectedCountry=country;q('[data-country-code]').textContent=country.dial;q('[data-open-country]').setAttribute('aria-label',`Country code: ${country.name} ${country.dial}`);await closeDialog(countryDialog);form.elements.phone.focus();});fragment.append(button);
  }
  if(!fragment.childNodes.length){const empty=document.createElement('p');empty.className='country-empty';empty.textContent='No countries found.';fragment.append(empty);}q('[data-country-options]').replaceChildren(fragment);
}
q('[data-open-country]').addEventListener('click',()=>{closeGameMenu({immediate:true});q('#country-search').value='';renderCountries();openDialog(countryDialog);});
q('#country-search').addEventListener('input',event=>renderCountries(event.target.value));
fetch('/countries.json').then(response=>{if(!response.ok)throw Error();return response.json();}).then(value=>{countries=value;}).catch(()=>{});
q('[data-inline-terms]').addEventListener('click',()=>{const panel=q('[data-inline-terms-panel]');panel.hidden=!panel.hidden;q('[data-inline-terms]').setAttribute('aria-expanded',String(!panel.hidden));});
const fieldControl=name=>name==='game'?gameTrigger:form.elements[name];
for(const field of qa('[data-error]')){field.id='error-'+field.dataset.error;const input=fieldControl(field.dataset.error);if(input)input.setAttribute('aria-describedby',field.id);}
function showErrors(errors){qa('[data-error]').forEach(el=>{const key=el.dataset.error;el.textContent=errors[key]||'';const input=fieldControl(key);if(input)input.setAttribute('aria-invalid',String(Boolean(errors[key])));});}
form.addEventListener('input',event=>{const key=event.target.name;if(key){const error=q(`[data-error="${key}"]`);if(error)error.textContent='';event.target.removeAttribute('aria-invalid');}});
form.addEventListener('submit',async event=>{
  event.preventDefault();const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;data.phone=internationalPhone(data.phone,selectedCountry.dial);
  const validation=validateEntry(data);showErrors(validation.errors);q('[data-form-status]').textContent='';
  if(!validation.ok){fieldControl(Object.keys(validation.errors)[0])?.focus();return;}
  const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Saving your place…';form.setAttribute('aria-busy','true');
  try{
    const response=await fetch('https://playpause-waitlist.vercel.app/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data}),signal:AbortSignal.timeout(15000)});
    const result=await response.json();
    if(!response.ok||result.ok!==true){if(result.errors)showErrors(result.errors);throw Error(result.message||'We couldn’t save your place. Please try again.');}
    q('[data-form-view]').hidden=true;q('[data-success-view]').hidden=false;q('[data-success-view]').focus();
    waitlist.setAttribute('aria-labelledby','success-heading');q('[data-success-view] h2').id='success-heading';
    await playerPass.show({name:Array.from(validation.value.name).slice(0,24).join(''),game:validation.value.game,gameName:validation.value.game==='other'?validation.value.otherGame:gameOptions.find(([id])=>id===validation.value.game)?.[1]||'Player',winnerCount:settings.winnerCount});
  }catch(error){q('[data-form-status]').textContent=error.name==='TimeoutError'?'That took a little too long. Please try again.':error.message==='Failed to fetch'?'You seem to be offline. Your details are still here.':error.message;}
  finally{button.disabled=false;button.textContent='Count me in';form.removeAttribute('aria-busy');}
});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(!document.hidden)tick();});
q('[data-motion-toggle]').addEventListener('click',()=>{const paused=document.body.classList.toggle('motion-paused');const button=q('[data-motion-toggle]');button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'Play animation':'Pause animation');button.querySelector('span').textContent=paused?'▷':'Ⅱ';});
renderSettings();loadSettings();setInterval(()=>{if(!document.hidden)tick();},60000);setInterval(()=>{renderCountdown();if(!closed&&Date.now()+clockOffset>=Date.parse(settings.launchAt))tick();},1000);
