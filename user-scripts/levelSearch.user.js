// ==UserScript==
// @name     PFQ Shelter: Level Search
// @namespace    https://github.com/tarashia/
// @author       Mirzam
// @include      https://pokefarm.com/shelter
// @version  1
// @grant    none
// ==/UserScript==

/* Change these to modify script behavior */
const minimumLevel = 80;
const highlightColor = "white";
const addGlow = true;
const addBorder = false;
const glowStacks = 4;
/* glowStacks controls how big the glow is, if using glow */


/* Don't change below here */
const addClass = "foundHighLevel";

function addCSS() {
  let cssElem = document.createElement('style');
  document.getElementsByTagName('head')[0].append(cssElem);
  cssElem.innerHTML = "."+addClass+" {";
  if(addGlow) {
    cssElem.innerHTML += "filter:";
    for(let i=0; i<glowStacks; i++) {
      cssElem.innerHTML += "drop-shadow(0 0 3px "+highlightColor+")";
    }
    cssElem.innerHTML += ";";
  }
  if(addBorder) {
    cssElem.innerHTML += "border: 4px solid "+highlightColor+";";
  }
  cssElem.innerHTML += "}";
}

function tagPokemon() {
  const shelterArea = document.getElementById('shelterarea');
  const pkmn = shelterArea.getElementsByClassName('tooltip_content');
  const regex = /\(Lv\.(\d+)/; // find level and put it in group 1
  for(let i=0; i<pkmn.length; i++) {
    let matches = pkmn[i].innerHTML.match(regex);
    if(matches && matches.length > 1) {
      let pkmnLvl = parseInt(matches[1]);
      if(pkmnLvl >= minimumLevel) {
        pkmn[i].previousSibling.classList.add(addClass);
      }
    }
  }
}

function observeShelter() {
  const shelterArea = document.getElementById('shelterarea');
  if(!shelterArea) {
    return false;
  }
  // we should only need to watch for when the children (pkmn) change
  const observerConfig = { childList: true, characterData: false };
  const observer = new MutationObserver(function() {
    tagPokemon();
  });
  observer.observe(shelterArea, observerConfig);
  tagPokemon(); // run immediately as well
  return observer;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function(){
  addCSS();
  let observer = false;
  let attempts = 0;
  while(observer === false && attempts < 10) {
    attempts ++;
    observer = observeShelter();
    await sleep(500);
  }
})();
