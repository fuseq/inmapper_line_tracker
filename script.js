const minLat = 37.425808, maxLat = 37.426196;
const minLng = 31.851793, maxLng = 31.852540;

let linesArray = []; // Tüm çizgileri tutacak dizi

document.addEventListener("DOMContentLoaded", function() {

    // SVG dosyasını 'files' klasöründen yükleme
    fetch('files/0.svg')
    .then(response => response.text()) // Dosyayı metin olarak al
    .then(svgText => {
        // SVG içeriğini bir DOM elementine dönüştür
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

        // 'Doors' id'sine sahip <g> öğesini al
        const doorsGroup = svgDoc.getElementById('Doors');
        
        if (doorsGroup) {
            // Bu grup içerisindeki tüm <line> öğelerini al
            const lines = doorsGroup.getElementsByTagName('line');
            
            // <line> öğeleri üzerinde döngü yap
            Array.from(lines).forEach(line => {
                const id = line.id;  // line id'si
                const x1 = parseFloat(line.getAttribute('x1')); // Başlangıç X koordinatı
                const y1 = parseFloat(line.getAttribute('y1')); // Başlangıç Y koordinatı
                const x2 = parseFloat(line.getAttribute('x2')); // Bitiş X koordinatı
                const y2 = parseFloat(line.getAttribute('y2')); // Bitiş Y koordinatı
                
                // Koordinatları LatLng'ye dönüştür
                const startLatLng = localCoordinateToLatLng(x1, y1);
                const endLatLng = localCoordinateToLatLng(x2, y2);
                
                // Line'ı diziye ekle
                linesArray.push({
                    id: id,
                    start: startLatLng,
                    end: endLatLng
                });
                
                console.log(`Line ID: ${id}, Start: (${startLatLng.lat}, ${startLatLng.lng}), End: (${endLatLng.lat}, ${endLatLng.lng})`);
            });
        }
    })
    .catch(error => console.error('SVG dosyası okunurken hata oluştu:', error));

    // SVG'deki lokal koordinatları Lat/Lng'ye çeviren fonksiyon
    function localCoordinateToLatLng(x, y) {
        var northWestLat = 37.425808;
        var northWestLng = 31.851793;
        var southEastLat = 37.426196;
        var southEastLng = 31.852540;

        var latRealDiff = northWestLat - southEastLat;
        var lngRealDiff = southEastLng - northWestLng;

        var svgHeight = document.querySelector('svg').viewBox.baseVal.height;
        var svgWidth = document.querySelector('svg').viewBox.baseVal.width;

        var latLocalDiff = (y / svgHeight) * latRealDiff;
        var lngLocalDiff = (x / svgWidth) * lngRealDiff;

        return new L.LatLng(northWestLat - latLocalDiff, northWestLng + lngLocalDiff);
    }

    var map = L.map('map').setView([37.426, 31.852], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var lc = L.control.locate({
        position: 'topright',
        drawCircle: true,
        follow: false,
        setView: 'once',
        locateOptions: { enableHighAccuracy: true }
    }).addTo(map);

    function checkLocation(lat, lng) {
        let popup = document.getElementById("popup");

        // Dışarıda durumunu kontrol et
        if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
            popup.innerText = "❌ Dışarıda";
            popup.style.background = "lightcoral";
            popup.classList.add("show");
            setTimeout(() => popup.classList.remove("show"), 3000);
        } else {
            // İçeride değilse en yakın line'ı bul
            findClosestLine(lat, lng);
        }
    }

    function findClosestLine(lat, lng) {
        let closestLine = null;
        let minDistance = Infinity;

        // Kullanıcı konumuyla her bir line'ın mesafesini hesapla
        linesArray.forEach(line => {
            // Başlangıç ve bitiş noktalarının mesafesini hesapla
            let startDist = map.distance([lat, lng], [line.start.lat, line.start.lng]);
            let endDist = map.distance([lat, lng], [line.end.lat, line.end.lng]);
            
            // En yakın olanı bul
            let minLineDist = Math.min(startDist, endDist);

            if (minLineDist < minDistance) {
                minDistance = minLineDist;
                closestLine = line;
            }
        });

        if (closestLine) {
            console.log(`En yakın Line ID: ${closestLine.id}`);
            let popup = document.getElementById("popup");
            popup.innerText = `En Yakın Kapı: ${closestLine.id}`;
            popup.style.background = "lightblue";
            popup.classList.add("show");
            setTimeout(() => popup.classList.remove("show"), 3000);
        }
    }

    map.on('locationfound', function(e) {
        checkLocation(e.latitude, e.longitude);
    });

    map.on('locationerror', function() {
        let popup = document.getElementById("popup");
        popup.innerText = "Konum Alınamadı ❌";
        popup.style.background = "lightcoral";
        popup.classList.add("show");
        setTimeout(() => popup.classList.remove("show"), 3000);
    });

    map.on('load', function() {
        lc.start();
    });

    map.fire('load');
});
