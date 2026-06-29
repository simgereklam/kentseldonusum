
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('img').forEach(function(img){
    img.addEventListener('error', function(){
      var c = img.closest('.project-card,.step-card,.card');
      if(c) c.classList.add('image-missing');
      img.remove();
    });
  });

  document.querySelectorAll('[data-whatsapp-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var data = new FormData(form);
      var lines = ['Merhaba, kentsel dönüşüm ön değerlendirme istiyorum.'];
      data.forEach(function(v,k){ if(String(v).trim()) lines.push(k + ': ' + v); });
      window.open('https://wa.me/905431813485?text=' + encodeURIComponent(lines.join('\n')), '_blank');
    });
  });

  var zoomImages = Array.prototype.slice.call(document.querySelectorAll('.project-card img, .step-card img'));
  if(zoomImages.length){
    var currentIndex = 0;
    var lightbox = document.createElement('div');
    lightbox.className = 'img-lightbox';
    lightbox.setAttribute('aria-hidden','true');
    lightbox.innerHTML = '<div class="img-lightbox-inner">' +
      '<button class="img-lightbox-close" type="button" aria-label="Kapat">×</button>' +
      '<button class="img-lightbox-prev" type="button" aria-label="Önceki görsel">‹</button>' +
      '<img src="" alt="">' +
      '<button class="img-lightbox-next" type="button" aria-label="Sonraki görsel">›</button>' +
      '<div class="img-lightbox-caption"></div>' +
      '</div>';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector('img');
    var caption = lightbox.querySelector('.img-lightbox-caption');
    var closeBtn = lightbox.querySelector('.img-lightbox-close');
    var prevBtn = lightbox.querySelector('.img-lightbox-prev');
    var nextBtn = lightbox.querySelector('.img-lightbox-next');

    function imageTitle(img){
      var card = img.closest('.project-card,.step-card');
      var title = card ? card.querySelector('h3,b') : null;
      return (title && title.textContent.trim()) || img.getAttribute('alt') || '';
    }
    function show(index){
      if(!zoomImages.length) return;
      currentIndex = (index + zoomImages.length) % zoomImages.length;
      var img = zoomImages[currentIndex];
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      caption.textContent = imageTitle(img);
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
    }
    function close(){
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden','true');
      lbImg.src = '';
      document.body.style.overflow = '';
    }
    function move(step){ show(currentIndex + step); }

    zoomImages.forEach(function(img, idx){
      img.setAttribute('title','Büyütmek için tıklayın');
      img.addEventListener('click', function(){ show(idx); });
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function(e){ e.stopPropagation(); move(-1); });
    nextBtn.addEventListener('click', function(e){ e.stopPropagation(); move(1); });
    lightbox.addEventListener('click', function(e){ if(e.target === lightbox) close(); });
    lbImg.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('keydown', function(e){
      if(!lightbox.classList.contains('open')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowLeft') move(-1);
      if(e.key === 'ArrowRight') move(1);
    });
  }
});
