
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
});
