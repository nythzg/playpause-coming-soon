const publicUrl='https://playpause.in/';
const inviteText='Join the PlayPause waitlist with me and get a chance to win P Coins you can use for in-game top-ups.\nT&Cs apply.';
const imageCache=new Map();
function asset(url){
  if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Artwork is unavailable.'));image.src=url;}));
  return imageCache.get(url);
}
function roundedImage(ctx,image,x,y,size,radius,rotation=0){
  ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(rotation*Math.PI/180);
  ctx.shadowColor='#0009';ctx.shadowBlur=45;ctx.shadowOffsetY=20;ctx.fillStyle='#1e2d4b';ctx.beginPath();ctx.roundRect(-size/2,-size/2,size,size,radius);ctx.fill();ctx.shadowColor='transparent';ctx.clip();
  if(image.naturalWidth!==image.naturalHeight){const ratio=image.naturalHeight/image.naturalWidth,w=size*.72,h=w*ratio;ctx.drawImage(image,-w/2,-h/2,w,h);}else ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();
  ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(rotation*Math.PI/180);ctx.strokeStyle='#ffffff38';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-size/2,-size/2,size,size,radius);ctx.stroke();ctx.restore();
}
function fitText(ctx,text,size,maxWidth,weight=550){
  while(size>24){ctx.font=`${weight} ${size}px Inter,system-ui,sans-serif`;if(ctx.measureText(text).width<=maxWidth)break;size--;}
}
async function renderPass(canvas,profile,format){
  const story=format==='story',width=1080,height=story?1920:1350;
  const [logo,mark,coin,qr,game,buddyOne,buddyTwo]=await Promise.all([
    asset('/assets/brand/playpause-lockup-night-clean.svg'),asset('/assets/brand/playpause-mark-night.svg'),asset('/assets/launch/p-coin.webp'),asset('/invite-qr.svg'),
    asset(profile.game==='other'?'/assets/brand/playpause-mark-night.svg':`/assets/launch/${profile.game}.webp`),asset('/assets/launch/pubg-mobile.webp'),asset('/assets/launch/honor-of-kings.webp')
  ]);
  await document.fonts.ready;canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#080b12';ctx.fillRect(0,0,width,height);
  const bloom=ctx.createRadialGradient(720,height*.45,20,600,height*.45,750);bloom.addColorStop(0,'#325acb52');bloom.addColorStop(.5,'#152c6928');bloom.addColorStop(1,'#080b1200');ctx.fillStyle=bloom;ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#bed3ff1b';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(32,32,width-64,height-64,38);ctx.stroke();
  ctx.drawImage(logo,72,story?82:65,390,390*458/2400);
  const titleY=story?342:265,titleSize=story?145:117;
  ctx.font=`600 ${titleSize}px Inter,system-ui,sans-serif`;ctx.letterSpacing='-7px';ctx.fillStyle='#f6f8ff';ctx.fillText('I’m in.',72,titleY);
  const titleGradient=ctx.createLinearGradient(72,0,850,0);titleGradient.addColorStop(0,'#c0ceff');titleGradient.addColorStop(1,'#668aff');ctx.fillStyle=titleGradient;ctx.fillText('Your move.',72,titleY+titleSize*1.08);ctx.letterSpacing='0px';
  const centerY=story?865:620,primarySize=story?425:310;
  ctx.save();ctx.globalAlpha=.075;ctx.translate(660,centerY-120);ctx.rotate(-.12);ctx.drawImage(mark,-180,-120,440,285);ctx.restore();
  roundedImage(ctx,buddyOne,760,centerY-(story?280:155),story?155:115,30,12);
  roundedImage(ctx,buddyTwo,105,centerY+(story?160:90),story?145:110,28,-12);
  roundedImage(ctx,game,330-primarySize*.25,centerY-primarySize*.47,primarySize,story?90:65,-9);
  ctx.save();ctx.translate(820,centerY+(story?185:130));ctx.rotate(.14);ctx.shadowColor='#0008';ctx.shadowBlur=30;ctx.drawImage(coin,-100,-100,200,200);ctx.restore();
  const profileY=story?1230:850,profileHeight=story?190:170;
  const glass=ctx.createLinearGradient(72,profileY,1008,profileY+profileHeight);glass.addColorStop(0,'#a3bfff18');glass.addColorStop(1,'#1f335c16');ctx.fillStyle=glass;ctx.beginPath();ctx.roundRect(72,profileY,936,profileHeight,24);ctx.fill();ctx.strokeStyle='#b8ceff29';ctx.stroke();
  ctx.fillStyle='#eff4ff';fitText(ctx,profile.name,story?86:73,864,600);ctx.fillText(profile.name,108,profileY+(story?89:78));
  ctx.fillStyle='#b5c9ef';fitText(ctx,profile.gameName,story?46:42,864,500);ctx.fillText(profile.gameName,110,profileY+(story?151:134),864);
  const qrY=story?1530:1060,qrSize=story?210:170;
  ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(72,qrY,qrSize,qrSize,22);ctx.fill();ctx.drawImage(qr,84,qrY+12,qrSize-24,qrSize-24);
  const textX=72+qrSize+35;ctx.fillStyle='#eef3ff';ctx.font=`550 ${story?47:41}px Inter,system-ui,sans-serif`;ctx.fillText('Join the waitlist.',textX,qrY+60);ctx.fillStyle='#9cb6ff';ctx.font=`500 ${story?42:36}px Inter,system-ui,sans-serif`;ctx.fillText('playpause.in',textX,qrY+119);
  ctx.fillStyle='#8c9fc1';ctx.font='450 24px Inter,system-ui,sans-serif';ctx.fillText(`${profile.winnerCount} players win P Coins. T&Cs apply.`,72,height-(story?88:64));
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(new File([blob],`playpause-player-pass-${format}.png`,{type:'image/png'})):reject(Error('Could not prepare the image.')),'image/png'));
}

export function createPlayerPass(root){
  const canvas=root.querySelector('canvas'),status=root.querySelector('[data-pass-status]'),nameInput=root.querySelector('[data-pass-name]');
  let format='story',profile,file,revision=0;
  const buttons=[...root.querySelectorAll('[data-share-pass],[data-save-pass]')];
  async function refresh(){
    if(!profile)return;const token=++revision;buttons.forEach(button=>button.disabled=true);status.textContent='';
    root.querySelector('[data-pass-preview]').dataset.format=format;
    try{const next=await renderPass(canvas,{...profile,name:nameInput.value.trim()||profile.name},format);if(token===revision)file=next;}catch{status.textContent='Your place is saved. The artwork couldn’t load—please try again.';file=null;}
    finally{if(token===revision)buttons.forEach(button=>button.disabled=!file);}
  }
  function save(){if(!file)return;const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Image saved. Add it to your story, status or post.';}
  for(const button of root.querySelectorAll('[data-pass-format]'))button.addEventListener('click',()=>{format=button.dataset.passFormat;for(const item of root.querySelectorAll('[data-pass-format]'))item.setAttribute('aria-pressed',String(item===button));refresh();});
  root.querySelector('[data-save-pass]').addEventListener('click',save);
  root.querySelector('[data-share-pass]').addEventListener('click',async()=>{
    if(!file)return;
    if(typeof navigator.share==='function'&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:'My PlayPause Player Pass',text:inviteText,url:publicUrl});status.textContent='';}catch(error){if(error.name!=='AbortError')status.textContent='Sharing is unavailable. Use Save image instead.';}
    }else{save();status.textContent='Image saved. This browser doesn’t support sharing image files directly.';}
  });
  root.querySelector('[data-edit-pass]').addEventListener('click',()=>{const label=root.querySelector('[data-pass-name-field]');label.hidden=!label.hidden;if(!label.hidden)nameInput.focus();});
  nameInput.addEventListener('input',refresh);
  return {async show(value){profile=value;nameInput.value=value.name;canvas.setAttribute('aria-label',`${value.name}’s ${value.gameName} Player Pass. Join the waitlist at playpause.in.`);await refresh();}};
}
