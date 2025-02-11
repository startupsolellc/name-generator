// Ana sayfaya yönlendirme fonksiyonu
function goHome() {
    window.location.href = "index.html";
}

// Önceden üretilen isimleri saklamak için değişken
let previousNames = new Set();

// Google Fonts API URL (Kendi API Key'in varsa ekleyebilirsin, ancak ücretsiz kullanım için aşağıdaki şekilde kullanabiliriz)
const googleFontsApi = "https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyD..."; // API key gerekebilir

// Rastgele Google Font seçen fonksiyon
async function getRandomFont() {
    try {
        const response = await fetch(googleFontsApi);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const randomFont = data.items[Math.floor(Math.random() * data.items.length)].family;
            return randomFont;
        }
    } catch (error) {
        console.error("Google Fonts API request failed:", error);
    }
    return "Arial"; // Hata olursa varsayılan font
}

// API'den isim üretme ve sonuçları ekrana yerleştirme (Benzersiz isimler + Dinamik Font)
async function generateNames() {
    const keywords = sessionStorage.getItem("keywords") || "Startup";
    const resultsContainer = document.getElementById("results-container");
    const titleText = document.getElementById("results-title");

    // 🔄 Loading Animasyonu Ekle (Tam Ortada)
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading-container";
    loadingDiv.innerHTML = `<div class="spinner"></div>`;
    document.body.appendChild(loadingDiv); // Sayfanın tamamına ekle

    setTimeout(async () => {
        try {
            let uniqueNames = [];
            let attempts = 0;
            const maxAttempts = 5; // Maksimum 5 kez tekrar kontrol edecek

            while (uniqueNames.length < 4 && attempts < maxAttempts) {
                const response = await fetch("/.netlify/functions/generate-name", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ keywords })
                });

                const data = await response.json();

                if (data.names && data.names.length > 0) {
                    const newNames = data.names.filter(name => !previousNames.has(name));

                    uniqueNames.push(...newNames);
                    uniqueNames = [...new Set(uniqueNames)]; // Her ihtimale karşı tekrarları kaldır
                }

                attempts++;
            }

            document.body.removeChild(loadingDiv); // Loading animasyonunu kaldır

            if (uniqueNames.length > 0) {
                resultsContainer.innerHTML = ""; // Önceki içeriği temizle
                titleText.innerHTML = `Generated names for "<b>${keywords}</b>":`;

                uniqueNames.slice(0, 4).forEach(async (name, index) => {
                    previousNames.add(name); // İsmi kaydet
                    const card = document.createElement("div");
                    
                    // Dinamik olarak rastgele bir font al
                    const randomFont = await getRandomFont();

                    // Fontu sayfaya yükle
                    const link = document.createElement("link");
                    link.href = `https://fonts.googleapis.com/css2?family=${randomFont.replace(/ /g, '+')}&display=swap`;
                    link.rel = "stylesheet";
                    document.head.appendChild(link);

                    // Kartın stilini fonta göre değiştir
                    card.style.fontFamily = `"${randomFont}", sans-serif`;
                    card.className = "card";
                    card.innerText = name;
                    resultsContainer.appendChild(card);

                    // 8 saniye sonra fade efekti ile kartları göster
                    setTimeout(() => {
                        card.classList.add("show");
                    }, 500 + index * 500);
                });
            } else {
                resultsContainer.innerHTML = "<p class='text-red-500'>No unique names available. Try again.</p>";
            }
        } catch (error) {
            console.error("API request error:", error);
            document.body.removeChild(loadingDiv); // Hata olsa bile loading kaldır
        }
    }, 8000); // ⏳ 8 saniye bekletme süresi
}

// Ana sayfada anahtar kelimeyi al ve yönlendir
document.getElementById("generate-button")?.addEventListener("click", function() {
    const keywords = document.getElementById("keywords").value.trim();
    if (keywords) {
        sessionStorage.setItem("keywords", keywords);
        window.location.href = "results.html";
    } else {
        alert("Please enter a keyword!");
    }
});

// Sayfa yüklendiğinde otomatik isim üret
if (window.location.pathname.includes("results.html")) {
    window.onload = generateNames;
}
