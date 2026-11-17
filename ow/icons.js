/* GambaGolf: icons. Every ability, upgrade, item, relic and ball skin has its own sign: a glyph cut into a medallion.
   The medallion's shape and metal say what kind of thing it is (round and jewelled for an ability, an iron hex for an upgrade,
   a leather tag for an item, gilt for a relic, a glass sphere for a ball skin); the glyph says which one. */
(()=>{
const O=window.OW;
const P=d=>`<path fill-rule='evenodd' d='${d}'/>`,C=(x,y,r)=>`<circle cx='${x}' cy='${y}' r='${r}'/>`;
const GL={
 ball:P('M12 3a9 9 0 100 18 9 9 0 000-18zM8.600 6.200a2.600 2.600 0 110 5.200 2.600 2.600 0 010-5.200z'),
 twin:C(8,14,5.6)+C(16.6,9,4.8),
 hammer:P('M4 3h16a1 1 0 011 1v6a1 1 0 01-1 1h-6.300v10.500a1.700 1.700 0 01-3.400 0V11H4a1 1 0 01-1-1V4a1 1 0 011-1z'),
 drop:P('M12 2c4 5.400 7 8.400 7 12.200a7 7 0 01-14 0C5 10.400 8 7.400 12 2z'),
 axe:P('M10.300 2h3v2.200c4.200.2 7.200 2.600 7.700 5.800-.5 3.200-3.500 5.600-7.700 5.800V22h-3z'),
 burst:P('M12 1l2.400 6.200L20.500 4l-3.200 6.100L23 12l-5.700 1.900 3.200 6.100-6.100-3.200L12 23l-2.400-6.200L3.500 20l3.200-6.100L1 12l5.700-1.900L3.500 4l6.100 3.200z'),
 shield:P('M12 2l8 3v6c0 5-3.300 9-8 11-4.700-2-8-6-8-11V5z'),
 heart:P('M12 21C5 15.500 2.500 12 2.500 8.500a5 5 0 019.500-2.200 5 5 0 019.500 2.200c0 3.500-2.500 7-9.500 12.500z'),
 bounce:P('M2.500 5l2.400-1.500L12 14.200l5-7.600-2.600-1.700L22 2.500l-.4 7.700-2.500-1.700L12 19.300z'),
 quake:C(12,5,3.4)+P('M2 13h7l2-3.500 3 8.500 2-5h6v3h-4l-3.700 8-3.300-9-1 1H2z'),
 note:P('M9 4l10-2v12.500a3.400 3 0 11-2-2.700V6.200l-6 1.200v9.100a3.400 3 0 11-2-2.700z'),
 sun:C(12,12,4.6)+P('M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.200 5.600l1.400-1.400 2.800 2.800L7 8.400zM15.600 17l1.400-1.400 2.800 2.800-1.400 1.400zM4.200 18.400L7 15.600 8.400 17l-2.800 2.800zM15.600 7l2.800-2.800 1.400 1.400L17 8.400z'),
 horn:P('M2.500 10.500C9 11.500 14 9 19 3l2.500 2.500C19.500 13.500 13 20 6 20.500a3.200 5 0 01-3.500-10z'),
 moon:P('M15.500 2a10 10 0 100 20 8.200 8.200 0 010-20z'),
 flag:P('M5 2h2.200v20H5zM8.500 3h12l-3 4.500 3 4.500h-12z'),
 bolt:P('M14 1L4 13.500h6.500L9 23l11-13.500h-6.500z'),
 arcs:C(12,12,2.6)+P('M4 12a8 8 0 018-8v2.600A5.400 5.400 0 006.600 12zM12 20a8 8 0 008-8h-2.600a5.400 5.400 0 01-5.400 5.400z'),
 flame:P('M12.500 2c.5 4.500 6 6.500 6 12.500a6.500 6.500 0 01-13 0c0-2.200 1-3.900 2.200-5 0 2 .8 3.200 2 3.400C9.500 9 11 5.500 12.500 2z'),
 bars:P('M3 15h3.500v6H3zM8.200 11h3.500v10H8.200zM13.400 7h3.500v14h-3.500zM18.600 3H22v18h-3.400z'),
 three:C(5.6,16,3.4)+C(12,7.6,3.4)+C(18.400,16,3.4),
 stream:C(4,20,1.6)+C(8,16,2.1)+C(12.6,11.4,2.7)+C(18.200,5.800,3.5),
 orb:C(12,12,4)+P('M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.600a7.400 7.400 0 110 14.800 7.400 7.400 0 010-14.800z'),
 hourglass:P('M5 2h14v3l-5 7 5 7v3H5v-3l5-7-5-7z'),
 meteor:C(15.4,15.4,6.2)+P('M2 2l9.500 6.500-3 3zM2 9.500l5 4-2 2zM9.500 2l4 5-2 2z'),
 prism:P('M12 2.500L22 20.500H2zm0 5.500L7 17.500h10z'),
 snow:P('M11 2h2v20h-2zM3.800 6.200l1-1.700 17.400 10-1 1.700zM3.800 17.800l17.400-10 1 1.700-17.400 10z')+C(12,12,2.6),
 vortex:C(12,12,3)+P('M12 2a10 10 0 019.600 12.800l-3-.9A6.900 6.900 0 105.100 12H2A10 10 0 0112 2zM12 22a10 10 0 01-7-2.900l2.200-2.200A6.900 6.900 0 0018 15.400l2.800 1.300A10 10 0 0112 22z'),
 arrow:P('M21.500 2.500l-1.600 7.300-2.200-2.200L7.400 17.900V21H4.800v-1.800H3v-2.600h3.100L16.400 6.300l-2.200-2.200z'),
 eye:P('M12 5c5 0 8.500 4 10 7-1.500 3-5 7-10 7S3.500 15 2 12c1.500-3 5-7 10-7zm0 3a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z'),
 target:C(12,12,2.4)+P('M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14zm0 2.500a4.500 4.500 0 100 9 4.500 4.500 0 000-9zm0 1.500a3 3 0 110 6 3 3 0 010-6z'),
 cross:P('M11 1h2v5.100a6 6 0 014.900 4.900H23v2h-5.100a6 6 0 01-4.900 4.900V23h-2v-5.100A6 6 0 016.100 13H1v-2h5.100A6 6 0 0111 6.100zm1 7.100a3.900 3.900 0 100 7.800 3.900 3.900 0 000-7.800z')+C(12,12,1.5),
 pierce:P('M2 11h4.500V4h2.600v7H16V7l6 5-6 5v-4H9.100v7H6.500v-7H2z'),
 rain:P('M5 2h2.600v6.500H10L6.300 13 2.600 8.500H5zM11 8h2.600v6.500H16L12.300 19l-3.700-4.500H11zM17 2h2.600v6.500H22L18.300 13l-3.700-4.500H17z'),
 weight:P('M9.200 6.500a3 3 0 115.600 0H18l3 14.500H3L6 6.500zm2.800-2.400a1.200 1.200 0 100 2.400 1.200 1.200 0 000-2.400z'),
 star:P('M12 2l2.900 6.300 6.900.8-5.100 4.700 1.400 6.800L12 17.200l-6.100 3.400 1.400-6.800L2.200 9.100l6.900-.8z'),
 seek:P('M4 21c0-9.500 4.500-14.500 11.500-14.800V2L22 8.200l-6.500 6.200V10C10.500 10.300 8 14 8 21z'),
 splinter:P('M12 2l2 9-2 3-2-3zM3 9l7 5-.5 3.500L6.500 17zM21 9l-3.500 8-3 .5L14 14zM9 19l3-2.500 3 2.500-3 3.500z'),
 sword:P('M19 2h3v3L11.500 15.500l1.500 1.500-1.500 1.500-2-2L6 20l-2-2 3.500-3.500-2-2L7 11.500l1.500 1.500z'),
 wing:P('M2 14.500C4 7.500 10 3.500 22 3.500c-1 3-3 5-6 6 2 0 3 .4 4 1-2 3-5 4-8 4 1 .5 2 .9 3 1-3 3-8 3-13-1z'),
 magnet:P('M4 3h5v9a3 3 0 006 0V3h5v9a8 8 0 01-16 0zM4 3h5v3H4zM15 3h5v3h-5z'),
 potion:P('M9 2h6v2.200h-1V8l5 9a3.400 3.400 0 01-3 5H8a3.400 3.400 0 01-3-5l5-9V4.200H9zm-1.300 13.800h8.600L13.800 11h-3.600z'),
 cup:P('M5 2h14v4a7 7 0 01-5.500 6.800V19H17v3H7v-3h3.500v-6.200A7 7 0 015 6z'),
 feather:P('M20.500 2c1 8.500-3 14.500-10 16.500l-4.500 4-1.500-1.500 4-4.500C10.500 9.500 14 4 20.500 2z'),
 cloud:P('M7 19a5 5 0 01-.6-9.960A6 6 0 0118 9.500a4.800 4.800 0 01-.5 9.500z'),
 bomb:C(10.4,14.4,7.4)+P('M14 7.500l2.500-2.500 2 2-2.500 2.500zM19 1.500l.9 2.200 2.200.9-2.200.9-.9 2.200-.9-2.200-2.200-.9 2.200-.9z'),
 vial:P('M10 2h4v4.500l3 3V20a2 2 0 01-2 2H9a2 2 0 01-2-2V9.500l3-3z'),
 chalk:P('M14.500 2l7.500 7.500-12.500 12.500L2 14.500zM5.500 14.500l4 4 2-2-4-4z'),
 pick:P('M2 9C8 3 16 3 22 9l-2 2.200c-2.300-2.100-4.700-3.200-7-3.600V22h-2V7.600c-2.300.4-4.700 1.500-7 3.600z'),
 whet:P('M6 7h15l-3 10H3zM7.500 9.500L6 14.500h10.500L18 9.500z'),
 net:P('M12 2a10 10 0 100 20 10 10 0 000-20zm-1 2.200V11H4.600A7.500 7.500 0 0111 4.200zm2 0A7.500 7.500 0 0119.400 11H13zM4.600 13H11v6.800A7.500 7.500 0 014.600 13zm8.400 0h6.400a7.500 7.500 0 01-6.400 6.800z'),
 mirror:P('M12 2a6.500 7.500 0 011.600 14.770V22h-3.200v-5.230A6.500 7.500 0 0112 2zm0 2.500a4 5 0 100 10 4 5 0 000-10z'),
 jar:P('M5 3h14v4H5zM6 8.500h12V20a2 2 0 01-2 2H8a2 2 0 01-2-2zm2.500 4v5h7v-5z'),
 pile:P('M2 20.500L12 5l10 15.500z')+C(6,7,1.4)+C(18.500,8,1.2),
 bell:P('M12 2a2 2 0 012 2v.6a6.500 6.500 0 014.500 6.200V15l2 3v1.200h-17V18l2-3v-4.200A6.500 6.500 0 0110 4.600V4a2 2 0 012-2zM9.400 20.600h5.200a2.600 2.600 0 01-5.200 0z'),
 lens:P('M10 2a8 8 0 016.300 12.900l5.200 5.200-1.900 1.900-5.200-5.200A8 8 0 1110 2zm0 2.600a5.400 5.400 0 100 10.800 5.400 5.400 0 000-10.800z'),
 wheel:C(12,12,2.4)+P('M12 2a10 10 0 100 20 10 10 0 000-20zm-1 2.700V9a3.200 3.200 0 00-1 .6L6.300 7.400A7.500 7.500 0 0111 4.700zm2 0a7.500 7.500 0 014.700 2.700L14 9.600a3.200 3.200 0 00-1-.6zM5.200 9.200L8.900 11.300a3.200 3.200 0 000 1.400l-3.700 2.100a7.500 7.500 0 010-5.600zm13.600 0a7.500 7.500 0 010 5.600l-3.700-2.100a3.200 3.200 0 000-1.400zM10 14.400a3.200 3.200 0 001 .6v4.300a7.500 7.500 0 01-4.700-2.700zm4 0l3.700 2.200a7.500 7.500 0 01-4.700 2.700V15a3.200 3.200 0 001-.6z'),
 bag:P('M8 7V5a4 4 0 018 0v2h3l2 15H3L5 7zm2 0h4V5a2 2 0 00-4 0z'),
 charm:P('M12 1.500a2.500 2.500 0 011.600 4.420L19 13l-7 9-7-9 5.400-7.080A2.500 2.500 0 0112 1.500zm0 7.400L8.300 13 12 17.800 15.700 13z'),
 anvil:P('M2 5h15l5-2-2 6h-4l1 5 3 3v2H5v-2l3-3 1-5H2z'),
 idol:C(12,5.5,3.5)+P('M8 10h8l2 5-2 1v6H8v-6l-2-1z'),
 coin:C(12,12,3)+P('M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14z'),
 gate:P('M3 22V11a9 9 0 0118 0v11h-2.600V11a6.400 6.400 0 00-12.800 0v11zM8 12h2v10H8zM11 10h2v12h-2zM14 12h2v10h-2z'),
 skull:P('M12 2c5 0 8 3.500 8 8 0 2.600-1.200 4.400-3 5.600V20h-2.200v-2h-1.600v2h-2.400v-2H9.200v2H7v-4.400C5.200 14.400 4 12.600 4 10c0-4.500 3-8 8-8zM8.600 8.500a2.200 2.200 0 100 4.400 2.200 2.200 0 000-4.400zm6.800 0a2.200 2.200 0 100 4.400 2.200 2.200 0 000-4.400z'),
 book:P('M2 4c4-1 7-.5 9 1v15c-2-1.500-5-2-9-1zM22 4c-4-1-7-.5-9 1v15c2-1.500 5-2 9-1z'),
 spike:P('M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z')
};
const AB={iron:'ball',twin:'twin',sunder:'hammer',rage:'drop',cleave:'axe',shatter:'burst',bash:'shield',leech:'heart',ricochet:'bounce',quake:'quake',
 note:'note',mend:'heart',hymn:'sun',anthem:'horn',lull:'moon',rally:'flag',discord:'bolt',echo:'arcs',dirge:'flame',crescendo:'bars',
 volley:'three',stream:'stream',orb:'orb',stasis:'hourglass',chain:'bolt',meteor:'meteor',prism:'prism',frost:'snow',wildfire:'flame',singular:'vortex',
 quick:'arrow',aimed:'eye',mark:'target',bullseye:'cross',pierce:'pierce',rain:'rain',hamstring:'weight',deadeye:'star',seeker:'seek',splinter:'splinter'};
const UP={vigor:'heart',might:'sword',lode:'magnet',haste:'wing',sl_wild:'star',sl_line:'wing',sl_pay:'coin',sl_jack:'star',sl_mirror:'hourglass',sl_nail:'shield',sl_grave:'skull',thorns:'burst',regen:'drop',lucky:'coin',slayer:'skull',culler:'axe',steady:'hourglass',grit:'shield',
 w_hide:'shield',w_file:'chalk',w_exec:'axe',w_bulk:'heart',w_guard:'flag',b_hymn:'sun',b_ballad:'heart',b_chorus:'note',b_reson:'arcs',b_encore:'horn',
 m_fourth:'three',m_orb:'orb',m_focus:'target',m_barrier:'shield',m_surge:'stream',a_eye:'eye',a_draw:'arrow',a_crit:'star',a_twin:'twin',a_hunter:'target',
 rebound:'bounce',pyre:'flame',zeal:'bars',keen:'cross',ward:'charm',w_brute:'meteor',b_kindle:'flame',m_ember:'flame',a_quiver:'rain'};
const IT={draught:'potion',tonic:'cup',phoenix:'feather',smoke:'cloud',bomb:'bomb',oil:'vial',chalk:'chalk',magnet:'magnet',pick:'pick',glass:'hourglass',whet:'whet',net:'net',banner:'flag',mirror:'mirror',salve:'jar',horn:'horn'};
const RE={salt:'pile',bell:'bell',lens:'lens',axle:'wheel',satchel:'bag',charm:'charm',anvil:'anvil',ember:'flame',feather:'feather',idol:'idol',purse:'coin',chalice:'cup'};
const NODE={battle:'skull',mini:'sword',boss:'skull',trap:'spike',treasure:'bag',tome:'book',shrine:'flame',forge:'anvil',gamble:'bag',start:'gate',go:'gate',prac:'target',retry:'sword',again:'gate'};
{const st=document.createElement('style');let css='';for(const k in GL)css+=`.g-${k}{--g:url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${GL[k]}</svg>`).replace(/'/g,'%27')}")}\n`;st.textContent=css;document.head.appendChild(st)}
/* what kind of thing a key names, and its glyph. Keys: 'ab:<class>:<i>', 'ab:<i>' with a class, 'up:x' or a bare upgrade name, 'it:x', 're:x', 'sk:x', 'n:<floor type>' */
O.iconOf=function(key,cls){
  const p=String(key).split(':');
  if(p[0]==='ab'){const c=p.length>2?p[1]:cls,a=O.CLASSES[c]&&O.CLASSES[c].ab[+p[p.length-1]];return{kind:'ab',cls:c,g:a?AB[a.id]||'star':'star'}}
  if(p[0]==='it')return{kind:'it',g:IT[p[1]]||'bag'};
  if(p[0]==='re')return{kind:'re',g:RE[p[1]]||'star'};
  if(p[0]==='sk')return{kind:'sk',skin:p[1]};
  if(p[0]==='n')return{kind:'n',g:NODE[p[1]]||'skull'};
  const u=p[0]==='up'?p[1]:p[0],U=O.UPGRADES[u];return{kind:'up',cls:U&&U.cls,g:UP[u]||'star'}};
O.ico=function(key,cls,extra){
  const o=O.iconOf(key,cls),e=document.createElement('span');e.className='ico k-'+o.kind+(o.cls?' c-'+o.cls:'')+(extra?' '+extra:'');e.setAttribute('aria-hidden','true');
  if(o.kind==='sk'){const k=O.SKINS[o.skin]||{},cc=cls&&O.CLASSES[cls]?O.CLASSES[cls].col:'#c9d2de';e.style.setProperty('--sc',k.col||cc);e.style.setProperty('--sg',k.glow||k.col||cc)}
  else{const i=document.createElement('i');i.className='g-'+o.g;e.appendChild(i)}
  return e};
O.kindName=function(key,cls){const o=O.iconOf(key,cls);return o.kind==='ab'?'Ability':o.kind==='it'?'Item':o.kind==='re'?'Relic':o.kind==='sk'?'Ball skin':o.cls?O.CLASSES[o.cls].name+' upgrade':'Upgrade'};
})();
