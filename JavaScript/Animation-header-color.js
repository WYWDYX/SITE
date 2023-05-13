    window.onload = function() {
      window.scrollTo(0, 1);
      window.scrollTo(0, -1);
    }
    
    var header2 = document.querySelector(".header-2");
    var header2Top = header2.offsetTop;
    
    window.onscroll = function() {
      if (window.pageYOffset > header2Top) {
        header2.classList.add("color");
      } else {
        header2.classList.remove("color");
      }
    };