document.addEventListener("DOMContentLoaded", function() {
    
  // Checks that site is being rendered on mobile safari only (i.e. non-MacOS safari)
  var isMobileSafari = /iPhone/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent) && !/CriOS/i.test(navigator.userAgent) && !/FxiOS/i.test(navigator.userAgent);

  if (isMobileSafari) {
      
    var spainImage = document.getElementById('spain-img');
    if (spainImage) {
      spainImage.style.maxWidth = '70%';
      spainImage.style.height = '110px';
    }

    var habitatImage = document.getElementById('habitat-img');
    if (habitatImage) {
      habitatImage.style.maxWidth = '85%';
      habitatImage.style.height = '180px';
    }
    
    var footerIframe = document.getElementById('footer-container');
    if (footerIframe) {
      footerIframe.style.height = '550px';
    }
      
    var sidepageFooter = document.getElementById('msafari-sidepage-footer');
    if (sidepageFooter) {
      sidepageFooter.style.height = '550px';
      sidepageFooter.style.marginTop = '0px';
    }
  }
});

