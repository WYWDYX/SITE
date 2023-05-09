            var scene = document.getElementById('scene');
            var parallax = new Parallax(scene);
            
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('referrer');
    
    function redirectToPage(pageName) {
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = urlParams.get('referrer');
      
      if (referrer && referrer === pageName) {
        setTimeout(() => {
          window.location.href = pageName;
        }, 5000);
      }
    }
    
    redirectToPage('../index.html');
    redirectToPage('Music.html');
    redirectToPage('Web.html');
    redirectToPage('Me.html');
    redirectToPage('Privacy.html');
    redirectToPage('Copyright.html');