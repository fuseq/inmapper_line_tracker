const minLat = 40.9931327, maxLat = 40.9897231;
const minLng = 29.0386154, maxLng = 29.0350682;
let linesArray = []; // Tüm çizgileri tutacak dizi

document.addEventListener("DOMContentLoaded", function() {

    fetch('files/0.svg')
    .then(response => response.text())
    .then(svgText => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

        const doorsGroup = svgDoc.getElementById('Doors');
        if (doorsGroup) {
            const lines = doorsGroup.getElementsByTagName('line');
            const viewBox = svgDoc.documentElement.viewBox.baseVal;
            
            Array.from(lines).forEach(line => {
                const id = line.id;
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));

                const startLatLng = localCoordinateToLatLng(x1, y1, viewBox);
                const endLatLng = localCoordinateToLatLng(x2, y2, viewBox);

                linesArray.push({ id, start: startLatLng, end: endLatLng });
            });
        }
    })
    .catch(error => console.error('SVG yüklenirken hata:', error));

    function localCoordinateToLatLng(x, y, viewBox) {
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;

        const latLocalDiff = (y / viewBox.height) * latDiff;
        const lngLocalDiff = (x / viewBox.width) * lngDiff;

        return new L.LatLng(maxLat - latLocalDiff, minLng + lngLocalDiff);
    }

    var map = L.map('map').setView([40.991488, 29.036736], 18);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var lc = L.control.locate({
        position: 'topright',
        drawCircle: true,
        locateOptions: { enableHighAccuracy: true }
    }).addTo(map);

    lc.start(); 

    function showPopup(message, color) {
        let popup = document.getElementById("popup");
        popup.innerText = message;
        popup.style.background = color;
        popup.classList.add("show");
        setTimeout(() => popup.classList.remove("show"), 3000);
    }

    function checkLocation(lat, lng) {
        if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
            showPopup("❌ Dışarıda", "lightcoral");
        } else {
            findClosestLine(lat, lng);
        }
    }

    function findClosestLine(lat, lng) {
        let closestLine = null;
        let minDistance = Infinity;

        linesArray.forEach(line => {
            let startDist = map.distance([lat, lng], [line.start.lat, line.start.lng]);
            let endDist = map.distance([lat, lng], [line.end.lat, line.end.lng]);

            let minLineDist = Math.min(startDist, endDist);

            if (minLineDist < minDistance) {
                minDistance = minLineDist;
                closestLine = line;
            }
        });

        if (closestLine) {
            showPopup(`En Yakın Kapı: ${closestLine.id}`, "lightblue");
        }
    }

    map.on('locationfound', e => checkLocation(e.latitude, e.longitude));
    map.on('locationerror', () => showPopup("Konum Alınamadı ❌", "lightcoral"));
});
