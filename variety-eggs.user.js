// ==UserScript==
// @name         Variety eggs
// @namespace    TarashiaPFQ
// @description  Keep track of eggs during the hatch variety eggs tournament. Tracks lab & shelter eggs automatically - must manually add daycare, supplier, etc.
// @version      1.6
// @license      MIT
// @match        https://pokefarm.com/shelter
// @match        https://pokefarm.com/lab
// @icon         https://pokefarm.com/favicon.ico
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

(function() {

  // Change these to change how new/used/excluded eggs appear
  // Due to current style limitations, the used and exclude styles must also undo any of the above changes
  const newStyle = 'border: 3px solid blue;';
  const usedStyle = 'opacity: 0.3;';
  const wikiPage = 'https://pokefarm.wiki/List_of_Pok%C3%A9mon';

  // Initialize styles
  const isLab = window.location == 'https://pokefarm.com/lab';
  const isShelter = window.location == 'https://pokefarm.com/shelter';
  var styleNode = document.createElement('style');
  styleNode.innerText = '#labpage #egglist > div > img:not(.varietyUsed, .varietyExclude), #shelterpage #shelterarea .pokemon[data-stage="egg"] img:not(.varietyUsed, .varietyExclude) { '+newStyle+' } .varietyUsed:not(.varietyExclude) { '+usedStyle+' }';
  document.querySelector('body').append(styleNode);
  var buttonContainer = document.createElement('div');
  buttonContainer.id = 'varietyBtnContainer';
  var infoText = document.createElement('p');
  infoText.innerText = 'Variety eggs helper controls';
  infoText.style = 'font-weight: bold;'
  buttonContainer.append(infoText);
  buttonContainer.style = 'text-align: center;';

  // Highlight used eggs
  const doHighlight = (eggCode, applyClass) => {
    var querySelector = 'img[src*="'+eggCode+'"]';
    if(isLab) {
      querySelector = '#egglist '+querySelector;
    }
    else if(isShelter) {
      querySelector = '#shelterarea '+querySelector;
    }
    var eggs = document.querySelectorAll(querySelector);
    for(var i=0; i<eggs.length; i++) {
      eggs[i].classList.add(applyClass);
    }
  }
  const highlightEggs = () => {
    for(var i=0; i<usedEggs.length; i++) {
      doHighlight(usedEggs[i], 'varietyUsed');
    }
    for(var i=0; i<excludedEggs.length; i++) {
      doHighlight(excludedEggs[i], 'varietyExclude');
    }
  }

  // Storage interface
  var usedEggs = [];
  var excludedEggs = [];
  const storeData = () => {
    GM.setValue('usedEggs', JSON.stringify(usedEggs));
    GM.setValue('excludedEggs', JSON.stringify(excludedEggs));
  }
  const fetchData = async () => {
    const storedUsedData = await GM.getValue('usedEggs');
    if(storedUsedData) {
      try {
        usedEggs = JSON.parse(storedUsedData);
      } catch(e) {
        usedEggs = [];
        console.warn('Failed to parse stored used data:');
        console.warn(storedUsedData);
      }
    }
    const storedExcludeData = await GM.getValue('excludedEggs');
    if(storedExcludeData) {
      try {
        excludedEggs = JSON.parse(storedExcludeData);
      } catch(e) {
        excludedEggs = [];
        console.warn('Failed to parse stored excluded data:');
        console.warn(storedExcludeData);
      }
    }
  }
  fetchData();

  // Store egg data
  const storeEgg = (imgSrc,exclude=false) => {
    const imgLoc = imgSrc.indexOf('/img/');
    const pngLoc = imgSrc.indexOf('.png');
    const eggID = imgSrc.substring(imgLoc,pngLoc+4);
    if(!exclude) {
      console.log('Storing new egg: '+eggID);
      if(!usedEggs.includes(eggID)) {
        usedEggs.push(eggID);
        highlightEggs();
        storeData();
      }
      else {
        console.warn('Did not store repeat used egg: '+eggID);
      }
    }
    else {
      console.log('Storing excluded egg: '+eggID);
      if(!excludedEggs.includes(eggID)) {
        excludedEggs.push(eggID);
        highlightEggs();
        storeData();
      }
      else {
        console.warn('Did not store repeat exclude egg: '+eggID);
      }
    }
  }

  // Clear stored data
  const clearData = () => {
    if(document.getElementById('clearUsedEggs').checked) {
      usedEggs = [];
    }
    else if(document.getElementById('clearExcludedEggs').checked) {
      excludedEggs = [];
    }
    else {
      usedEggs = [];
      excludedEggs = [];
    }
    storeData();
    closeDialog();
  }
  const confirmClear = () => {
    var content = '<p>Are you sure you want to clear your data?</p><p>You <b>cannot</b> undo this action.</p>';
    content += '<div style="margin-bottom: 5px;"><input type="radio" id="clearUsedEggs" name="clearType" checked> <label for="clearUsedEggs">Used eggs only</label></div>';
    content += '<div style="margin-bottom: 5px;"><input type="radio" id="clearExcludedEggs" name="clearType" > <label for="clearExcludedEggs">Excluded eggs only</label></div>';
    content += '<div><input type="radio" id="clearAll" name="clearType"> <label for="clearAll">All data</label></div>';
    dialogBox(content, clearData, 'Yes, clear data', 'Cancel');
  }
  var clearButton = document.createElement('button');
  clearButton.innerText = 'Clear data';
  clearButton.onclick = confirmClear;
  buttonContainer.append(clearButton);

  // Manually add data
  const manualAdd = () => {
    var eggCode = document.getElementById('addExcludeCode').value;
    if(!eggCode.match('^[a-z0-9](\/[a-z0-9])+$')) {
      alert('Bad code format. Please try again.');
      return;
    }
    if(document.getElementById('addUsedEgg').checked) {
      storeEgg('/img/pkmn/'+eggCode+'.png');
    }
    else if(document.getElementById('addExcludedEgg').checked) {
      storeEgg('/img/pkmn/'+eggCode+'.png',true);
    }
    closeDialog();
  }
  const addWindow = () => {
    var content = '<p>Enter an image code. Example: c/0/7</p>';
    content += '<p><a href="'+wikiPage+'" target="_blank">Wiki page with all egg codes</a></p>';
    content += '<div style="margin-bottom: 5px;"><input id="addExcludeCode" type="text" style="width: 100%;"></input></div>';
    content += '<div style="margin-bottom: 5px;"><input type="radio" id="addUsedEgg" name="manualEntry" checked> <label for="addUsedEgg">Add used egg</label></div>';
    content += '<div><input type="radio" id="addExcludedEgg" name="manualEntry"> <label for="addExcludedEgg">Exclude egg</label></div>';
    dialogBox(content, manualAdd, 'Add egg', 'Cancel');
  }
  var addButton = document.createElement('button');
  addButton.innerText = 'Add/exclude egg';
  addButton.onclick = addWindow;
  addButton.style = 'margin-left: 15px;';
  buttonContainer.append(addButton);

  // Export & import data
  const updateData = () => {
    try {
      var importData = JSON.parse(atob(document.getElementById('importExportData').value));
    }
    catch(e) {
      alert('Bad backup format. Please try again.');
      console.warn(importData);
      return;
    }
    if('usedEggs' in importData && 'excludedEggs' in importData) {
      usedEggs = importData.usedEggs;
      excludedEggs = importData.excludedEggs;
      highlightEggs();
      storeData();
    }
    else {
      alert('Bad backup format. Please try again.');
      console.warn(importData);
      return;
    }
    closeDialog();
  }
  const showData = () => {
    var content = '<p>Here is your current saved data.</p><p>You can back it up, or transfer it to another device.</p>';
    var exportData = {
      usedEggs: usedEggs,
      excludedEggs: excludedEggs
    };
    content += '<textarea id="importExportData" style="width: 100%;" rows="5">'+btoa(JSON.stringify(exportData))+'</textarea>';
    dialogBox(content, updateData, 'Update egg list');
  }
  var exportButton = document.createElement('button');
  exportButton.innerText = 'Import/export data';
  exportButton.onclick = showData;
  exportButton.style = 'margin-left: 15px;';
  buttonContainer.append(exportButton);

  // Detect eggs adopted from lab
  const labWatch = () => {
    // buttons start disabled, so re-enable them
    clearButton.removeAttribute('disabled');
    addButton.removeAttribute('disabled');
    exportButton.removeAttribute('disabled');
    // remove old classes
    var oldEggs = document.querySelectorAll('.varietyUsed, .varietyExclude');
    for(var i=0; i<oldEggs.length; i++) {
      oldEggs[i].classList.remove('varietyUsed');
      oldEggs[i].classList.remove('varietyExclude');
    }
    highlightEggs();
  }
  const labAdoptWatch = () => {
    var eggPreview = document.getElementById('eggpreview');
    if(eggPreview) {
      var eggURL = eggPreview.querySelector('img').src;
      eggPreview.nextElementSibling.addEventListener('click', () => {
        storeEgg(eggURL);
      });
    }
  }
  if(isLab) {
    const labMO = new MutationObserver(labWatch);
    const labAdoptMO = new MutationObserver(labAdoptWatch);
    labMO.observe(document.getElementById('egglist'), { childList: true, subtree: true });
    labAdoptMO.observe(document.body, { childList: true, subtree: false });
    document.querySelector('#eggsbox360').append(buttonContainer);
  }

  // Detect eggs adopted from shelter
  const shelterWatch = () => {
    // buttons start disabled, so re-enable them
    clearButton.removeAttribute('disabled');
    addButton.removeAttribute('disabled');
    exportButton.removeAttribute('disabled');
    highlightEggs();
  }
  const shelterAdoptWatch = () => {
    var eggPreview = document.querySelector('.dialog .adoptme .plateform .egg');
    if(eggPreview) {
      document.getElementById('adoptloadbox').nextElementSibling.addEventListener('click', () => {
        storeEgg(eggPreview.style['background-image']);
      });
    }
  }
  if(isShelter) {
    const shelterMO = new MutationObserver(shelterWatch);
    const shelterAdoptMO = new MutationObserver(shelterAdoptWatch);
    shelterMO.observe(document.getElementById('shelterarea'), { childList: true, subtree: false });
    shelterAdoptMO.observe(document.body, { childList: true, subtree: false });
    try {
      const bgColor = window.getComputedStyle(document.querySelector('#sheltercommands')).getPropertyValue('background-color');
      buttonContainer.style.backgroundColor = bgColor;
    } catch(e) {
      console.warn('Failed to set button container background');
      console.warn(e);
    }
    buttonContainer.style.borderRadius = '0 0 6px 6px';
    buttonContainer.style.paddingTop = '10px';
    buttonContainer.style.paddingBottom = '5px';
    document.querySelector('#shelter').append(buttonContainer);
  }

  // Create dialog box - action must be a function or null
  const dialogBox = (content, action, actionText, closeText='Close') => {
    var dialog = document.createElement('div');
    dialog.classList = 'veDialog';
    var dialogDiv1 = document.createElement('div');
    var dialogDiv2 = document.createElement('div');
    var dialogDiv3 = document.createElement('div');
    var dialogContent = document.createElement('div');
    var dialogFooter = document.createElement('div');
    var closeBtn = document.createElement('button');
    closeBtn.setAttribute('type','button');
    closeBtn.style = 'float:right;margin:8px;';
    closeBtn.innerText = closeText;
    closeBtn.onclick = function() {
      closeDialog();
    }
    dialog.classList.add('dialog');
    dialog.appendChild(dialogDiv1);
    dialogDiv1.appendChild(dialogDiv2);
    dialogDiv2.appendChild(dialogDiv3);
    dialogContent.innerHTML = content;
    dialogContent.style = 'padding: 10px;';
    dialogDiv3.appendChild(dialogContent);
    dialogDiv3.appendChild(dialogFooter);
    dialogFooter.appendChild(closeBtn);
    if(action) {
      var actionBtn = document.createElement('button');
      actionBtn.setAttribute('type','button');
      actionBtn.style = 'float:right;margin:8px;';
      actionBtn.innerText = actionText;
      actionBtn.onclick = action;
      dialogFooter.appendChild(actionBtn);
    }
    var body = document.getElementsByTagName('body')[0];
    body.prepend(dialog);
    var core = document.getElementById('core');
    core.classList.add('scrolllock');
    return dialog;
  }
  const closeDialog = () => {
    var dialogs = document.getElementsByClassName('veDialog');
    for(var i=0; i<dialogs.length; i++) {
      dialogs[i].remove();
    }
    var core = document.getElementById('core');
    core.classList.remove('scrolllock');
  }

}
)();