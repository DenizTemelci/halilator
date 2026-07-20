// 🔑 KEY 1 (Parçalanmış)
const k1_p1 = "AQ.Ab8RN6JAzN9SPyhKcK2HToIC";
const k1_p2 = "Vm8vV2fa1G_bX2I71eXMb6S7vA";
const KEY_1 = k1_p1 + k1_p2;

// 🔑 KEY 2 (Parçalanmış)
const k2_p1 = "AQ.Ab8RN6I1Da0HuYjR7G53QQq1";
const k2_p2 = "-64PP6pbzMS4djczh1dGgzGpnA";
const KEY_2 = k2_p1 + k2_p2;

// Key Listesi ve Sıra Takibi
const API_KEYS = [KEY_1, KEY_2];
let aktifKeyIndex = 0;

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

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

async function cevapVer(cevap) {
    butonlariDevreDisiBirak(true);
    sohbetGecmisi.push({ role: "user", parts: [{ text: cevap }] });

    if (cevap === 'Evet') {
        evetSayaci++;
        hayirSayaci = 0;

        if (evetSayaci === 1) resimDegistir("bildim");
        else if (evetSayaci === 2) resimDegistir("emin");
        else resimDegistir("cok_emin");

        await new Promise(r => setTimeout(r, 2000));

    } else if (cevap === 'Hayır') {
        hayirSayaci++;
        evetSayaci = 0;

        if (hayirSayaci === 1) resimDegistir("bilemedim");
        else resimDegistir("yanlis_cevap");

        await new Promise(r => setTimeout(r, 2000));

    } else {
        evetSayaci = 0;
        hayirSayaci = 0;
    }

    dusunuyorResmiAyarla();
    document.getElementById("question-text").innerText = "Halilatör düşünüyor...";
    
    await geminiyeIstekAt();
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

// Çift Key Dönüşümlü İstek Fonksiyonu
async function geminiyeIstekAt(denemeSayisi = 0) {
    const MEVCUT_KEY = API_KEYS[aktifKeyIndex];
    aktifKeyIndex = (aktifKeyIndex + 1) % API_KEYS.length;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-goog-api-key": MEVCUT_KEY
            },
            body: JSON.stringify({ contents: sohbetGecmisi })
        });

        if (response.status === 429 || response.status === 503) {
            if (denemeSayisi < API_KEYS.length * 2) {
                console.warn("Sıradaki key limite takıldı, yedek key'e geçiliyor...");
                await new Promise(r => setTimeout(r, 1000));
                return await geminiyeIstekAt(denemeSayisi + 1);
            } else {
                document.getElementById("question-text").innerText = "İki anahtarın da limiti doldu. Lütfen 10-15 saniye bekleyip tekrar tıklayın.";
                butonlariDevreDisiBirak(false);
                return;
            }
        }

        const data = await response.json();

        if (data.error) {
            document.getElementById("question-text").innerText = "API Hatası: " + data.error.message;
            butonlariDevreDisiBirak(false);
            return;
        }

        if (!data.candidates || !data.candidates[0]) {
            document.getElementById("question-text").innerText = "Yanıt alınamadı, tekrar deneyin.";
            butonlariDevreDisiBirak(false);
            return;
        }

        const gelenYanit = data.candidates[0].content.parts[0].text.trim();
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
