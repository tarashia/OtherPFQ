// ==UserScript==
// @name     Upvote Tracker
// @version  1
// @match    https://pokefarm.com/forum/thread/*
// @grant    none
// ==/UserScript==

// originally suggested by tresh (@G8W)
(function() {
  const styleElement = document.createElement('style');

  // write your styles here
  styleElement.textContent = `
  .twentyVotes {
    font-weight: bold;
    .upvotes {
        background: #4caf50; 
      color: white;
    }
  }
  .tenVotes {
    font-style: italic;
    .upvotes {
        background: #efca5a; 
      color: black;
    }
  }
  `;
  document.head.appendChild(styleElement);

  //set your thresholds here, high to low
  const thresholds = [
    [20, 'twentyVotes'],
    [10, 'tenVotes']
  ];
  
  document.querySelectorAll('.upvotes span').forEach(element => {
    // the docs say to specify that the number is in base 10 with the second param
    const count = parseInt(element.innerHTML, 10);
    for(let i=0; i<thresholds.length; i++){
      // apply when threshold is exceeded
      if(count > thresholds[i][0]) {
        element.closest('.forumpost').classList.add(thresholds[i][1]);
        break;
      }
    }

  });
})();
