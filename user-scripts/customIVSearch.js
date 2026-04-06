// ==UserScript==
// @name         PFQ Dojo: Custom IV search
// @namespace    https://github.com/tarashia/
// @author       Mirzam
// @match        https://pokefarm.com/dojo/training
// @version  1
// @grant    none
// ==/UserScript==

/* Change these to modify script behavior */
const minPerfectIVs = 3; /* minimum number of perfect IVs to highlight, 1-6, 0 to disable */
const minPerfectIVs_color = 'white';
const minTotalStats = 0; /* minimum total stats, 1-186, 0 to disable */
const minTotalStats_color = 'red';
const minZeroIVs = 0; /* minimum number of zero IVs to hightlight, 1-6, 0 to disable */
const minZeroIVs_color = 'blue';
const customIVSet = 'x_x_x_x_x_x'; /* look for a specific arrangement of IV values. x is wild, set to x_x_x_x_x_x to disable*/
const customIVSet_color = 'yellow';
const addGlow = false;
const addBorder = true;
const highlightSize = 3; /* controls how big the glow or border size is */
const logLevel = 'normal'; /* may be "verbose", "normal", or "silent" */
const logPrefix = 'IV Search: ';

/* the order of this controls which takes priority */
const classSet = [
  ["customIVSetMatch",customIVSet_color],
  ["minPerfectIVsMatch",minPerfectIVs_color],
  ["minZeroIVsMatch",minZeroIVs_color],
  ["minTotalStatsMatch",minTotalStats_color],
];

function addCSS() {
  customLog('added CSS');
  for(let i=classSet.length-1; i>=0; i--) {
    let cssElem = document.createElement('style');
    document.getElementsByTagName('head')[0].append(cssElem);
    cssElem.innerHTML = "."+classSet[i][0]+" {";
    if(addGlow) {
      cssElem.innerHTML += "filter:";
      for(let j=0; j<highlightSize; j++) {
        cssElem.innerHTML += "drop-shadow(0 0 3px "+classSet[i][1]+")";
      }
      cssElem.innerHTML += ";";
    }
    if(addBorder) {
      cssElem.innerHTML += "border: "+highlightSize+"px solid "+classSet[i][1]+";";
    }
    cssElem.innerHTML += "}";
  }
}

async function tagPokemon() {
  const selectElement = document.getElementById('fs_pokemon');
  if(!selectElement) {
    customLog('pkmn select not open');
    return;
  }
  const pkmn = document.getElementsByClassName('fieldmon');
  const pkmnTips = document.querySelectorAll('.fieldmontip .item+div');
  if(pkmnTips.length < 1) {
    customLog('no pkmn seen');
    return;
  }
  customLog('tagging pkmn, seen: '+pkmn.length);
  let customIVs = customIVSet.split('_');
  if(customIVs.length != 6) {
    console.warn(logPrefix+'WARNING: could not parse custom IV set value');
  }
  for(let i=0; i<pkmnTips.length; i++) {
    let ivSet = pkmnTips[i].querySelectorAll('span');
    let numPerfect = 0;
    let numZero = 0;
    let totalIVs = 0;
    let totalCustomMatch = 0;
    for(let j=0; j<ivSet.length; j++) {
      let thisIV = parseInt(ivSet[j].innerHTML);
      if(thisIV == 31) {
        numPerfect++;
      }
      else if(thisIV == 0) {
        numZero++;
      }
      totalIVs += thisIV;
      if(customIVSet != 'x_x_x_x_x_x') {
        if(customIVs[j] == 'x') {
          totalCustomMatch ++;
        }
        else {
          let thisCustom = parseInt(customIVs[j]);
          if(!isNaN(thisCustom) && thisCustom == thisIV) {
            totalCustomMatch ++;
          }
        }
      }
    }
    let pkmnID = pkmn[i].getAttribute('data-id');
    if(numPerfect >= minPerfectIVs && minPerfectIVs > 0) {
      pkmn[i].classList.add("minPerfectIVsMatch");
      customLog('highlighted '+pkmnID+': matched min perfect IVs('+minPerfectIVs+')',1);
    }
    if(totalIVs >= minTotalStats && minTotalStats > 0) {
      pkmn[i].classList.add("minTotalStatsMatch");
      customLog('highlighted '+pkmnID+': matched min total stats ('+minTotalStats+')',1);
    }
    if(numZero >= minZeroIVs && minZeroIVs > 0) {
      customLog('highlighted '+pkmnID+': matched min zero IVs('+minZeroIVs+')',1);
    }
    if(totalCustomMatch == 6) {
      pkmn[i].classList.add("customIVSetMatch");
      customLog('highlighted '+pkmnID+': matched custom IV set('+customIVSet+')',1);
    }
    customLog('stats for '+pkmnID+': numPerfect='+numPerfect+'; numZero='+numZero+'; totalIVs='+totalIVs+'; totalCustomMatch='+totalCustomMatch+';');
  }
}

// dojo doesn't have a nice a div structure as shelter, need to watch for dialog open/close and page changes
function observePage() {
  const bodyElement = document.getElementsByTagName('body')[0];
  const observerConfig = { childList: true, characterData: false };
  const observer = new MutationObserver(function() {
    customLog("document childList changed");
    tagPokemon();
  });
  observer.observe(bodyElement, observerConfig);
  return observer;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// level: 0 = only in verbose, 1 = also in normal
function customLog(message, level=0) {
  if(logLevel == 'silent') {
    return;
  }
  if(logLevel == 'verbose' || level > 0) {
    console.log(logPrefix+message);
  }
}

(async function(){
  addCSS();
  let observer = false;
  let attempts = 0;
  while(observer === false && attempts < 10) {
    attempts ++;
    observer = observePage();
    await sleep(500);
  }
})();
