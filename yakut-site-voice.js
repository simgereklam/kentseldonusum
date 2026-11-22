window.yakutChatServiceUrl = document.querySelector('meta[name="yakut-chat-endpoint"]')?.content
 || 'https://kumtas-yakut-api.bloomyvanilla256.chatgpt.site/chat';

// Kurumsal siteye ait kısa yanıtlar ve bunların Aoede ses kayıtları.
window.yakutSiteVoice = Object.freeze({
 "welcome": "Merhaba, hoş geldiniz. Ben Kumtaş İnşaat dijital asistanınız Yakut. Sizin için ne yapabilirim?",
 "index": "Ana sayfadayız. Burada ücretsiz ön değerlendirme talebi gönderebilir, hizmet bölgelerini inceleyebilir ve E-İmar hesabını açabilirsiniz.",
 "kurumsal": "Kurumsal sayfasındayız. Kumtaş İnşaat iki bin dört yılında kuruldu. İnşaat, taahhüt, madencilik, hafriyat ve konut üretimi alanlarında çalışıyor.",
 "kentsel-donusum": "Kentsel Dönüşüm sayfasındayız. Süreç ön görüşme ve imar incelemesiyle başlar. Malik hakları, metrekare dengesi, sözleşme, teminat ve teslim şartları birlikte değerlendirilir.",
 "hizmetlerimiz": "Hizmetlerimiz sayfasındayız. Ücretsiz ön değerlendirme, imar ve ada parsel incelemesi, kat karşılığı inşaat, sözleşme ve anahtar teslim bina yenileme hizmetlerimizi burada inceleyebilirsiniz.",
 "projelerimiz": "Projelerimiz sayfasındayız. Tamamlanan, devam eden ve örnek çalışmalarımızı burada görebilirsiniz. Kendi binanız için ilçe, mahalle, ada parsel ve daire bilgileriyle ön değerlendirme isteyebilirsiniz.",
 "bolgeler": "Bölgeler sayfasındayız. Yenibosna, Bahçelievler, Bakırköy, Bağcılar, Güngören, Avcılar, Esenler, Küçükçekmece ve Zeytinburnu için ayrı sayfalarımız var.",
 "bolgelerimiz": "Bölgelerimiz sayfasındayız. İlçenizi seçerek hizmetleri ve binanız için ön değerlendirmede istenen bilgileri inceleyebilirsiniz.",
 "sss": "Sık Sorulan Sorular sayfasındayız. Burada riskli yapı, kat karşılığı inşaat, malik hakları, teminat, metrekare dengesi ve teslim süreci hakkında yanıtlar var.",
 "iletisim": "İletişim sayfasındayız. Buradan ücretsiz ön değerlendirme isteyebilir, ofis adresimize, sabit telefonumuza ve WhatsApp hattımıza ulaşabilirsiniz.",
 "basvuru": "Başvuru sayfasındayız. İlçe, mahalle, ada parsel ve bina bilgilerinizi girerek ücretsiz ön değerlendirme isteyebilirsiniz. Gönder düğmesi bilgileri WhatsApp mesajına dönüştürür.",
 "yakut-eimar": "E-İmar ve Ön Proje sayfasındayız. Bağcılar ve Bahçelievler için mahalle, ada ve parsel bilgisiyle belediyeyi sorgulayabilirsiniz. Net parsel alanı, TAKS ve emsal değerleriyle alan hesabı yapabilirsiniz.",
 "avcilar-kentsel-donusum": "Avcılar Kentsel Dönüşüm sayfasındayız. Merkez, Cihangir ve Denizköşkler çevresinde, zemin koşulları ve bina yaşı dikkate alınarak ön değerlendirme yapılabilir.",
 "bagcilar-kentsel-donusum": "Bağcılar Kentsel Dönüşüm sayfasındayız. Güneşli, Mahmutbey, Bağlar, Demirkapı ve Kirazlı dahil çevredeki binalar için arsa alanı, mevcut daire sayısı ve imar durumu incelenir.",
 "bahcelievler-kentsel-donusum": "Bahçelievler Kentsel Dönüşüm sayfasındayız. Siyavuşpaşa, Çobançeşme, Hürriyet ve çevresindeki binalarda mevcut daire hakları, arsa payları ve metrekare dengesi değerlendirilir.",
 "bakirkoy-kentsel-donusum": "Bakırköy Kentsel Dönüşüm sayfasındayız. İncirli, Osmaniye ve Kartaltepe çevresinde bina yenileme ön incelemesi yapılabilir. Arsa değeri, imar hakkı ve malik beklentileri birlikte değerlendirilir.",
 "esenler-kentsel-donusum": "Esenler Kentsel Dönüşüm sayfasındayız. Menderes, Nenehatun ve Fevzi Çakmak çevresinde bina yenileme, imar incelemesi ve malik görüşmeleri hakkında bilgi alabilirsiniz.",
 "gungoren-kentsel-donusum": "Güngören Kentsel Dönüşüm sayfasındayız. Merkez, Sanayi ve Tozkoparan çevresinde bina yenileme için malik anlaşması, metrekare dengesi ve ruhsat süreci değerlendirilir.",
 "kucukcekmece-kentsel-donusum": "Küçükçekmece Kentsel Dönüşüm sayfasındayız. Sefaköy, Halkalı ve Kanarya çevresinde arsa alanı, daire metrekareleri ve proje seçenekleri değerlendirilir.",
 "yenibosna-kentsel-donusum": "Yenibosna Kentsel Dönüşüm sayfasındayız. Çobançeşme, Zafer ve Hürriyet çevresinde ada parsel, arsa alanı ve daire metrekareleriyle bina yenileme ön değerlendirmesi yapılır.",
 "zeytinburnu-kentsel-donusum": "Zeytinburnu Kentsel Dönüşüm sayfasındayız. Merkezefendi, Sümer ve Telsiz çevresindeki binalar için imar şartları ve kat karşılığı yenileme seçenekleri incelenir.",
 "ofis": "Ofis sabit telefon numaramız. Sıfır. İki, bir, iki. Dokuz, beş, beş. Beş, beş. Dokuz, dokuz.",
 "whatsapp": "WhatsApp cep telefonu numaramız. Sıfır. Beş, dört, üç. Bir, sekiz, bir. Üç, dört. Sekiz, beş.",
 "adres": "Ofisimiz İstanbul Bahçelievler'de. Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, bina numarası iki yüz kırk beş, A harfi.",
 "bekle": "Bakıp size haber vereceğim. Lütfen biraz bekleyin.",
 "dinliyorum": "Efendim, dinliyorum.",
 "ulasamiyorum": "Şu anda canlı ses bağlantısına erişemiyorum. İsterseniz bulunduğumuz sayfayı, hizmetlerimizi veya iletişim bilgilerimizi anlatabilirim.",
 "riskli-yapi": "Riskli yapı değerlendirmesinde binanın deprem güvenliği ve teknik durumu incelenir. Binanız için ilk görüşmede bina yaşı, kat sayısı, arsa ve daire bilgileriyle ön değerlendirme isteyebilirsiniz.",
 "malik-haklari": "Maliklerin arsa payı, mevcut daire metrekareleri, imar hakkı ve yeni projedeki bağımsız bölümler birlikte değerlendirilir. Teslim şartları, teminat ve malzeme standardı sözleşmede açıklığa kavuşturulur.",
 "e-posta": "E-posta adresimiz. İnfo, et işareti, kumtaş, nokta com, nokta te re.",
 "sayfa-sorusu": "Bu sayfa hakkında daha fazla bilgi ister misiniz?"
});
