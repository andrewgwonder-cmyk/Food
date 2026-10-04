(function(){const map={'Завтрак':'b','Обед':'l','Ужин':'d','Перекусы':'s','Активность':'a','Вода':'w'};
function tag(){document.querySelectorAll('#app .sec').forEach(sec=>{const h=sec.querySelector('h3');let k=h&&map[h.textContent.trim()];if(!k&&sec.querySelector('.weightline'))k='k';if(k)sec.setAttribute('data-m',k)});document.querySelectorAll('.repbtn').forEach(b=>b.setAttribute('data-m','r'))}
new MutationObserver(tag).observe(document.getElementById('app'),{childList:true,subtree:true});tag();})();
(function(){const M={'завтрак':'b','обед':'l','ужин':'d','перекус':'s','активност':'a','вод':'w','вес':'k'};
function key(t){t=(t||'').toLowerCase();for(const k in M)if(t.includes(k))return M[k];return''}
function tagSheets(){document.querySelectorAll('#sheets .sheet').forEach(sh=>{const seg=sh.querySelector('.seg button.on');let k=seg?key(seg.textContent):'';if(!k){const h=sh.querySelector('.sh-h h2');k=key(h&&h.textContent)}
 if(k)sh.setAttribute('data-m',k);else sh.removeAttribute('data-m')})}
new MutationObserver(tagSheets).observe(document.getElementById('sheets'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});tagSheets();})();
