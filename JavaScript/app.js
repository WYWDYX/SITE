    var header2 = document.getElementById("header2");
    var header2Top = header2.offsetTop;
    
    window.onscroll = function () {
        if (window.pageYOffset > header2Top) {
            header2.classList.add("fixed");
            header2.classList.add("transition");
        } else {
            header2.classList.remove("fixed");
            header2.classList.remove("transition");
        }
    };
    
    /*var portrait = window.matchMedia("(orientation: portrait)");
    
    portrait.addListener(function () {
      if (portrait.matches) {
        document.getElementById("tip").style.display = "flex";
      } else {
        document.getElementById("tip").style.display = "none";
      }
    });
    
    if (portrait.matches) {
      document.getElementById("tip").style.display = "flex";
    } else {
      document.getElementById("tip").style.display = "none";
    }*/