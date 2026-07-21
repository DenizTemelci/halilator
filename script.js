// 🌐 Cloudflare Worker URL'n
const WORKER_URL = "https://halilator-api.ekrater1231.workers.dev";

let sohbetGecmisi = [];
let evetSayaci = 0;
let hayirSayaci = 0;
let sonDusunuyorResmi = 2;
let secilenOyunModu = "zeki"; // Varsayılan mod

window.onload = () => {
    resimDegistir("baslangic");
    modSecimEkraniGoster(); // Oyun açılır açılmaz mod seçimini göster
};

// 🎮 YENİ: MOD SEÇİM EKRANI
function modSecimEkraniGoster() {
    resimDegistir("baslangic");
    document.getElementById("question-text").innerText = "Hangi Halilatör ile oynamak istersin?\n\n🧠 Süper Zeki: Kesin mantık ve Akinator zekası!\n🤪 Şaşkın (Eğlenceli): Arda Turan aşığı, komik ve sallamasyon!";
    
    document.getElementById("action-buttons").innerHTML = `
        <button onclick="modSecVeBasla('zeki')" style="background-color: #2b5c8f; color: white;">🧠 Süper Zeki</button>
        <button onclick="modSecVeBasla('mal')" style="background-color: #d9534f; color: white;">🤪 Şaşkın (Eğlenceli)</button>
    `;
}

function modSecVeBasla(mod) {
    secilenOyunModu = mod; // Oyuncunun seçimini kaydettik ('zeki' veya 'mal')
    oyunuBaslat();
}

async function oyunuBaslat() {
    sohbetGecmisi = [
        { role: "user", parts: [{ text: "Oyun başladı. İlk sorunu sor." }] }
    ];
    
    evetSayaci = 0;
    hayirSayaci = 0;
    
    dusunuyorResmiAyarla();
    
    if (secilenOyunModu === "mal") {
        document.getElementById("question-text").innerText = "🤪 Şaşkın Halilatör düşünüyor... (Bakalım kimi sallayacak?)";
    } else {
        document.getElementById("question-text").innerText = "🧠 Süper Zeki Halilatör düşünüyor...";
    }
    
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
            // Seçilen modu (mod: secilenOyunModu) arka plana gönderiyoruz!
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
            
            if (secilenOyunModu === "mal") {
                document.getElementById("question-text").innerText = `🤪 Şaşkın Halilatör'ün tahmini: ${tahmin}!\n(Kesin salladı ama doğru mu?)`;
            } else {
                document.getElementById("question-text").innerText = `🧠 Süper Zeki Halilatör buldu: ${tahmin}!\nDoğru bildim mi?`;
            }
            
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
        if (secilenOyunModu === "mal") {
            document.getElementById("question-text").innerText = "Hahaha! Şaşkın Halil tamamen sallayarak bildi! 🤣🤣";
        } else {
            document.getElementById("question-text").innerText = "Harika! Süper Zeki Halilatör yine bildi! 😎";
        }
    } else {
        resimDegistir("bilemedim");
        if (secilenOyunModu === "mal") {
            document.getElementById("question-text").innerText = "Eee normal, Şaşkın Halil yine Arda Turan falan sanmıştır... 🤪🤣";
        } else {
            document.getElementById("question-text").innerText = "Tebrikler, beni yendin! 😅";
        }
    }

    // Oyun bitince tekrar başlatmak yerine mod seçimine döndürüyoruz
    document.getElementById("action-buttons").innerHTML = `
        <button onclick="modSecimEkraniGoster()">Tekrar Oyna (Mod Seç)</button>
    `;
}

function resimDegistir(durum) {
    const img = document.getElementById("halil-img");
    if (img) {
        img.src = `images/${durum}.png`;
    }
}
