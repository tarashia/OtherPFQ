// ==UserScript==
// @name         PFQ Shelter: Donor search
// @namespace    https://github.com/tarashia/
// @author       Mirzam
// @match        https://pokefarm.com/shelter
// @version  1
// @grant    none
// ==/UserScript==

/* Change these to modify script behavior */
const apiKey = "";
const matchUser = "b7q";
const speciesID = "472";
const highlightColor = "white";
/* color may be any HTML color keyword, or hex color value ex: #FFFFFF */
const addGlow = false;
const addBorder = true;
const highlightSize = 4;
/* controls how big the glow or border size is */


/* Don't change below here */
const addClass = "foundDonorMatch";

function addCSS() {
  let cssElem = document.createElement('style');
  document.getElementsByTagName('head')[0].append(cssElem);
  cssElem.innerHTML = "."+addClass+" {";
  if(addGlow) {
    cssElem.innerHTML += "filter:";
    for(let i=0; i<highlightSize; i++) {
      cssElem.innerHTML += "drop-shadow(0 0 3px "+highlightColor+")";
    }
    cssElem.innerHTML += ";";
  }
  if(addBorder) {
    cssElem.innerHTML += "border: "+highlightSize+"px solid "+highlightColor+";";
  }
  cssElem.innerHTML += "}";
}

async function callAPI(api, test=false) {
  const url = 'https://api.pokefarm.com/v1' + api;
  if(test) {
    console.log(url);
    return;
  }
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      }
    });
    if(!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error.message);
    console.log(url);
    return false;
  }
}

async function tagPokemon() {
  const shelterArea = document.getElementById('shelterarea');
  const pkmn = shelterArea.querySelectorAll('.pokemon[data-fid="' + speciesID + '"] + .tooltip_content');
  if(pkmn.length < 1) {
    return;
  }
  let  idList = '';
  for(let i=0; i<pkmn.length; i++) {
    if(idList.length > 0) {
      idList += ',';
    }
    idList += pkmn[i].getAttribute('data-adopt');
  }
  let api = '/pokemon/shelter/donors?adopts=' + idList;
  const result = await callAPI(api);
  if(result && Object.hasOwn(result, "adopts")) {
    for(let i=0; i<result.adopts.length; i++) {
      if(result.adopts[i].user_shortlink == matchUser || result.adopts[i].user_name == matchUser) {
        const toHighlight = shelterArea.querySelector('.tooltip_content[data-adopt="' + result.adopts[i].shortlink + '"]');
        toHighlight.previousSibling.classList.add(addClass);
      }
      else {
        console.log('Did not highlight egg donated by '+result.adopts[i].user_name);
      }
    }
  }
  else {
    console.error('Unexpected API return format');
    console.log(JSON.stringify(result));
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
