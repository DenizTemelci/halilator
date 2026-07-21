// 🌐 Cloudflare Worker URL'n
const WORKER_URL = "https://halilator-api.ekrater1231.workers.dev";

let sohbetGecmisi = [];
let evetSayaci = 0;
let hayirSayaci = 0;
let sonDusunuyorResmi = 2;

const SYSTEM_PROMPT = `Sen "Halilatör" adında bir Akinator kopyasısın. Görevin kullanıcının aklından tuttuğu kişiyi doğru tahmin etmektir.

KURALLAR:
1. Kullanıcıya her defasında sadece TEK BİR 'Evet/Hayır' sorusu sor.
2. Kullanıcının cevaplarına göre aklındaki kişiyi eleyerek ilerle.
3. Soruyu sorarken direkt soruyu yaz, ekstra açıklama yapma.
4. %90 emin olduğunda soruyu bırak ve TAM OLARAK şu formatta yanıt ver: "TAHMİN: [Aklındaki Kişinin Adı]".
5. Türk kültürüne, ünlülerine, yayıncılarına ve genel dünya tarihine/popüler kültürüne hakimsin.`;

window.onload = () => {
    resimDegistir("baslangic");
};

async function oyunuBaslat() {
    sohbetGecmisi = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "user", parts: [{ text: "Oyun başladı. İlk sorunu sor." }] }
    ];
    
    evetSayaci = 0;
    hayirSayaci = 0;
    
    dusunuyorResmiAyarla();
    document.getElementById("question-text").innerText = "Halilatör düşünüyor...";
    
    await geminiyeIstekAt();
}

function cevapVer(cevap) {
    butonlariDevreDisiBirak(true);
    sohbetGecmisi.push({ role: "user", parts: [{ text: cevap }] });

    // Sayacı güncelle
    if (cevap === 'Evet') {
        evetSayaci++;
        hayirSayaci = 0;
    } else if (cevap === 'Hayır') {
        hayirSayaci++;
        evetSayaci = 0;
    } else {
        evetSayaci = 0;
        hayirSayaci = 0;
    }

    // Butona basınca ÖNCE düşünüyor resmi ve yazısı çıksın
    dusunuyorResmiAyarla();
    document.getElementById("question-text").innerText = "Halilatör düşünüyor...";
    
    // Arkadan yapay zekaya isteği gönder
    geminiyeIstekAt();
}

function dusunuyorResmiAyarla() {
    if (sonDusunuyorResmi === 1) {
        resimDegistir("dusunuyor_2");
        sonDusunuyorResmi = 2;
    } else {
        resimDegistir("dusunuyor");
        sonDusunuyorResmi = 1;
    }
}

// Yeni soru ekrana gelirken tepki resmini ayarlayan akıllı fonksiyon
function tepkiResmiGoster() {
    if (evetSayaci === 0 && hayirSayaci === 0) {
        resimDegistir("baslangic");
    } else if (evetSayaci === 1) {
        resimDegistir("bildim");
    } else if (evetSayaci === 2) {
        resimDegistir("emin");
    } else if (evetSayaci >= 3) {
        resimDegistir("cok_emin");
    } else if (hayirSayaci === 1) {
        resimDegistir("bilemedim");
    } else if (hayirSayaci >= 2) {
        resimDegistir("yanlis_cevap");
    }
}

async function geminiyeIstekAt() {
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ contents: sohbetGecmisi })
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById("question-text").innerText = "API Hatası: " + (data.error.message || data.error);
            butonlariDevreDisiBirak(false);
            return;
        }

        // Hem yeni Worker'ın (data.text) hem de eski formatın (data.candidates) desteklendiği güvenli okuma
        const gelenYanit = (data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "").trim();

        if (!gelenYanit) {
            document.getElementById("question-text").innerText = "Yanıt alınamadı, tekrar deneyin.";
            butonlariDevreDisiBirak(false);
            return;
        }

        sohbetGecmisi.push({ role: "model", parts: [{ text: gelenYanit }] });

        if (gelenYanit.startsWith("TAHMİN:")) {
            const tahmin = gelenYanit.replace("TAHMİN:", "").trim();
            resimDegistir("cok_emin");
            document.getElementById("question-text").innerText = `Aklındaki kişi: ${tahmin}!\nDoğru bildim mi?`;
            
            document.getElementById("action-buttons").innerHTML = `
                <button onclick="sonuc(true)">Evet, Doğru!</button>
                <button onclick="sonuc(false)">Hayır, Bilemedin</button>
            `;
        } else {
            // YAPAY ZEKADAN YENİ SORU GELDİĞİ AN TEPKİ RESMİNİ GÖSTERİYORUZ!
            tepkiResmiGoster();

            document.getElementById("question-text").innerText = gelenYanit;
            butonlariGuncelle();
            butonlariDevreDisiBirak(false);
        }

    } catch (error) {
        console.error("Bağlantı Hatası:", error);
        document.getElementById("question-text").innerText = "Bağlantı hatası oluştu!";
        butonlariDevreDisiBirak(false);
    }
}

function butonlariGuncelle() {
    document.getElementById("action-buttons").innerHTML = `
        <button onclick="cevapVer('Evet')">Evet</button>
        <button onclick="cevapVer('Hayır')">Hayır</button>
        <button onclick="cevapVer('Emin Değilim')">Emin Değilim</button>
    `;
}

function butonlariDevreDisiBirak(durum) {
    const butonlar = document.querySelectorAll("#action-buttons button");
    butonlar.forEach(b => b.disabled = durum);
}

function sonuc(dogruMu) {
    if (dogruMu) {
        resimDegistir("bildim");
        document.getElementById("question-text").innerText = "Harika! Halilatör yine bildi! 😎";
    } else {
        resimDegistir("bilemedim");
        document.getElementById("question-text").innerText = "Tebrikler, beni yendin! 😅";
    }

    document.getElementById("action-buttons").innerHTML = `
        <button onclick="oyunuBaslat()">Tekrar Oyna</button>
    `;
}

function resimDegistir(durum) {
    const img = document.getElementById("halil-img");
    if (img) {
        img.src = `images/${durum}.png`;
    }
}
