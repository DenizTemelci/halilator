// 🌐 Cloudflare Worker URL'n
const WORKER_URL = "https://halilator-api.ekrater1231.workers.dev";

let sohbetGecmisi = [];
let evetSayaci = 0;
let hayirSayaci = 0;
let sonDusunuyorResmi = 2;
let secilenOyunModu = "zeki";

window.onload = () => {
    resimDegistir("baslangic");
    modSecimEkraniGoster();
};

// 🎮 MOD SEÇİM EKRANI (Açıklama yok, direkt isimler!)
function modSecimEkraniGoster() {
    resimDegistir("baslangic");
    document.getElementById("question-text").innerText = "Hangi Halilatör ile oynamak istersin?";
    
    document.getElementById("action-buttons").innerHTML = `
        <button onclick="modSecVeBasla('zeki')" style="background-color: #2b5c8f; color: white;"> Zeki Halil</button>
        <button onclick="modSecVeBasla('mal')" style="background-color: #d9534f; color: white;"> Mal Halil (Orijinal)</button>
    `;
}

function modSecVeBasla(mod) {
    secilenOyunModu = mod;
    oyunuBaslat();
}

async function oyunuBaslat() {
    sohbetGecmisi = [
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

    dusunuyorResmiAyarla();
    document.getElementById("question-text").innerText = "Halilatör düşünüyor...";
    
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
            body: JSON.stringify({ contents: sohbetGecmisi, mod: secilenOyunModu })
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById("question-text").innerText = "API Hatası: " + (data.error.message || data.error);
            butonlariDevreDisiBirak(false);
            return;
        }

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
            
            document.getElementById("question-text").innerText = `Halilatör'ün tahmini: ${tahmin}!\nDoğru bildim mi?`;
            
            document.getElementById("action-buttons").innerHTML = `
                <button onclick="sonuc(true)">Evet, Doğru!</button>
                <button onclick="sonuc(false)">Hayır, Bilemedin</button>
            `;
        } else {
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
        document.getElementById("question-text").innerText = "NOLDU YARRRAM";
    } else {
        resimDegistir("bilemedim");
        document.getElementById("question-text").innerText = "Cevap ne o zaman YARRRAM";
    }

    document.getElementById("action-buttons").innerHTML = `
        <button onclick="modSecimEkraniGoster()">Tekrar Oyna</button>
    `;
}

function resimDegistir(durum) {
    const img = document.getElementById("halil-img");
    if (img) {
        img.src = `images/${durum}.png`;
    }
}
