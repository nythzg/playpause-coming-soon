export const gameOptions = Object.freeze([
  ['mobile-legends','Mobile Legends'],['bgmi','BGMI'],['pubg-mobile','PUBG'],
  ['honor-of-kings','Honor of Kings'],['genshin-impact','Genshin Impact'],
  ['magic-chess','Magic Chess'],['honkai-star-rail','Honkai: Star Rail'],
  ['zenless-zone-zero','Zenless Zone Zero'],['honkai-impact-3','Honkai Impact 3'],
  ['wuthering-waves','Wuthering Waves'],['super-sus','Super Sus'],
  ['farlight-84','Farlight 84'],['marvel-rivals','Marvel Rivals'],['other','Other']
]);
export const defaultSettings = Object.freeze({
  headline:'The wait is\nalmost over.',
  description:'',
  progressStartAt:'2026-10-20T00:00:00+05:30',
  launchAt:'2026-11-14T00:00:00+05:30',
  winnerCount:100,
  expiryDays:30
});
export const consentVersion='launch-2026-11-v1';
export function launchCountdown(settings,now=Date.now()) {
  const end=Date.parse(settings.launchAt),total=Number.isFinite(end)?Math.max(0,Math.ceil((end-now)/1000)):0;
  return {days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60};
}
// Advance on India calendar days, keeping launch day at 100%.
export function launchProgress(settings,now=Date.now()) {
  const start=Date.parse(settings.progressStartAt),end=Date.parse(settings.launchAt);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 0;
  if(now>=end)return 100;
  if(now<=start)return 0;
  const indiaDay=timestamp=>Math.floor((timestamp+330*60000)/86400000);
  const duration=Math.max(1,indiaDay(end)-indiaDay(start));
  return Math.max(0,Math.min(99,Math.floor((indiaDay(now)-indiaDay(start))/duration*100)));
}
export function internationalPhone(number,dialCode){
  const clean=String(number||'').replace(/[\s()-]/g,'');
  if(clean.startsWith('+'))return clean.startsWith(dialCode)?clean:'';
  return /^\d+$/.test(clean)?dialCode+clean:'';
}
const text=(value)=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
export function validateEntry(input) {
  const errors={};
  const name=text(input?.name),game=text(input?.game),otherGame=text(input?.otherGame),playerId=text(input?.playerId);
  const email=text(input?.email).toLowerCase();
  let phone=text(input?.phone).replace(/[\s()-]/g,'');
  if(/^[6-9]\d{9}$/.test(phone))phone='+91'+phone;
  if(/^91[6-9]\d{9}$/.test(phone))phone='+'+phone;
  if(name.length<2||name.length>80||/[<>\x00-\x1f]/.test(name))errors.name='Enter your name.';
  if(!gameOptions.some(([id])=>id===game))errors.game='Choose your game.';
  if(game==='other'&&(otherGame.length<2||otherGame.length>80||/[<>\x00-\x1f]/.test(otherGame)))errors.otherGame='Tell us which game you play.';
  if(!playerId||playerId.length>100||/[<>\x00-\x1f]/.test(playerId))errors.playerId='Enter your player ID or in-game name.';
  if(email.length>254||! /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(email))errors.email='Enter a valid email address.';
  if(!/^\+[1-9]\d{7,14}$/.test(phone))errors.phone='Enter a valid phone number with country code.';
  if(input?.consent!==true)errors.consent='Please agree to the terms and privacy notice.';
  return {ok:!Object.keys(errors).length,errors,value:{name,game,otherGame:game==='other'?otherGame:'',playerId,email,phone,consentVersion}};
}
export function validateSettings(input) {
  const headline=String(input.headline||'').trim(),description=text(input.description);
  if(headline.length<5||headline.length>80||/[<>]/.test(headline))throw Error('Use a headline between 5 and 80 characters.');
  if(description.length>110||/[<>]/.test(description))throw Error('Keep the description under 110 characters.');
  if(!Number.isFinite(Date.parse(input.launchAt)))throw Error('Choose a valid launch date.');
  const progressStartAt=input.progressStartAt||defaultSettings.progressStartAt;
  if(!Number.isFinite(Date.parse(progressStartAt))||Date.parse(progressStartAt)>=Date.parse(input.launchAt))throw Error('Start the progress before the launch date.');
  const winnerCount=Number(input.winnerCount),expiryDays=Number(input.expiryDays);
  if(!Number.isInteger(winnerCount)||winnerCount<1||winnerCount>10000)throw Error('Enter a valid number of winners.');
  if(!Number.isInteger(expiryDays)||expiryDays<1||expiryDays>365)throw Error('Enter an expiry between 1 and 365 days.');
  return {headline,description,progressStartAt:new Date(progressStartAt).toISOString(),launchAt:new Date(input.launchAt).toISOString(),winnerCount,expiryDays};
}
