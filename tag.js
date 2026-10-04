(function(){const map={'Завтрак':'b','Обед':'l','Ужин':'d','Перекусы':'s','Активность':'a','Вода':'w'};
function tag(){document.querySelectorAll('#app .sec').forEach(sec=>{const h=sec.querySelector('h3');let k=h&&map[h.textContent.trim()];if(!k&&sec.querySelector('.weightline'))k='k';if(k)sec.setAttribute('data-m',k)});document.querySelectorAll('.repbtn').forEach(b=>b.setAttribute('data-m','r'))}
new MutationObserver(tag).observe(document.getElementById('app'),{childList:true,subtree:true});tag();})();
