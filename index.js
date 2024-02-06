let validat = false;
let usuari, contrasenya, seccio_origen, mapa, geoID;
let storage = window.localStorage;
let scriptURL = "https://script.google.com/macros/s/AKfycbwO6FnBnaBmxrzPRyLDhV8D6pW7Pe6V8-SYIdSHZXMmg8JqjJwQz8H8zA8wl3U6u2pW/exec";

window.onload = () => { 
    let base_de_dades = storage.getItem("base_de_dades");   
    if(base_de_dades == null) {
        indexedDB.open("Dades").onupgradeneeded = event => {   
            event.target.result.createObjectStore("Fotos", {keyPath: "ID", autoIncrement:true}).createIndex("Usuari_index", "Usuari");
        }
        storage.setItem("base_de_dades","ok");
    }
    document.getElementById("obturador").addEventListener("change", function() {
        if(this.files[0] != undefined) {
            let canvas = document.getElementById("canvas");
            let context = canvas.getContext("2d");
            let imatge = new Image;
            imatge.src = URL.createObjectURL(this.files[0]);
            imatge.onload = () => {
                canvas.width = imatge.width;
                canvas.height = imatge.height;                
                context.drawImage(imatge,0,0,imatge.width,imatge.height);
                document.getElementById("foto").src = canvas.toDataURL("image/jpeg");
                document.getElementById("icona_camera").style.display = "none";
                document.getElementById("desa").style.display = "unset";
            }
        }
    });
    mapa = L.map("seccio_4").setView([41.72, 1.82], 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapa);
    let vegueries = [[41.39, 2.17, "Àmbit metropolità (Barcelona)"],
                     [42.17, 0.89, "Alt Pirineu i Aran (Tremp)"],
                     [41.12, 1.24, "Camp de Tarragona (Tarragona)"],
                     [41.73, 1.83 ,"Comarques centrals (Manresa)"],
                     [41.98, 2.82, "Comarques gironines (Girona)"],
                     [41.62, 0.62, "Ponent (Lleida)"],
                     [40.81, 0.52, "Terres de l'Ebre (Tortosa)"],
                     [41.35, 1.70, "Penedès (Vilafranca del Penedès"]];
    for (i in vegueries) {
        L.marker([vegueries[i][0], vegueries[i][1]],{title:vegueries[i][2]}).addTo(mapa);
    }
    usuari = storage.getItem("usuari");
    if (usuari != "" && usuari != null) {
        inicia_sessio();
    } else {
        document.getElementById("seccio_0").style.display = "flex";
    }
    
}

function nou_usuari() {
    usuari = document.getElementById("nom_usuari").value;
    contrasenya = document.getElementById("contrasenya").value;
    let consulta_1 = scriptURL + "?query=select&where=usuari&is=" + usuari;
    fetch(consulta_1)
        .then(resposta => resposta.json())
        .then(resposta => {
            if(resposta.length == 0) {
                let consulta_2 = scriptURL + "?query=insert&values=" + usuari + "$$" + contrasenya;
                fetch(consulta_2)
                    .then(resposta => {
                        if (resposta.ok) {
                            alert("S'ha completat el registre d'usuari.");                          
                            inicia_sessio();
                        }
                        else {
                            alert("S'ha produït un error en el registre d'usuari.");
                        }
                    })
            } 
            else {
                alert("Ja existeix un usuari amb aquest nom.");
            }
        });
}

function inici_sessio() {
    usuari = document.getElementById("nom_usuari").value;
    contrasenya = document.getElementById("contrasenya").value;
    let consulta = scriptURL + "?query=select&from=usuaris&where=usuari&is=" + usuari + "&and=contrasenya&equal=" + contrasenya;
    fetch(consulta)
        .then(resposta => resposta.json())
        .then(resposta => {
            if(resposta.length == 0) {
                alert("El nom d'usuari o la contrasenya no són correctes.");
            }
            else {
                alert("S'ha iniciat correctament la sessió.");
                inicia_sessio();
            }
        });
}

function inicia_sessio() {
    validat = true;
    storage.setItem("usuari", usuari);
    document.getElementById("seccio_0").style.display = "none";
    canvia_seccio(1); 
}

function tanca_sessio() {
    if (validat) {
        let vull_sortir = window.confirm("Vols tancar la sessió?");
        if (vull_sortir) {
            storage.setItem("usuari", "");
            location.reload();
        }
    }
}

function canvia_seccio(num_boto) {
    if (validat) {
        const menu = document.getElementById("menu");
        const num_botons = menu.children.length;
        for (let i = 1; i < num_botons; i++) {
            let boto = document.getElementById("boto_" + i);
            let seccio = document.getElementById("seccio_" + i);
            if (i == num_boto) {
                boto.style.color = "#950E17";
                boto.style.backgroundColor = "#FCDEE0";
                seccio.style.display = "flex";
            }
            else {
                boto.style.color = "white";
                boto.style.backgroundColor = "#950E17";
                seccio.style.display = "none";
            }
        }
    }
    if (num_boto == 3) {
        omple_llista();
    }
    if (num_boto == 4) {
        mapa.invalidateSize();
        if (typeof geoID === "undefined") {
            navigator.geolocation.watchPosition(geoExit);
        }
    }
}

function desa_foto() {
    let nou_registre = {
        Usuari: usuari,
        Data: format_data(new Date(Date.now())),
        Foto: document.getElementById("foto").src
    };
    indexedDB.open("Dades").onsuccess = event => {   
        event.target.result.transaction("Fotos", "readwrite").objectStore("Fotos").add(nou_registre).onsuccess = () => {
            document.getElementById("desa").style.display = "none";
            alert("La foto s'ha desat correctament.");
        };
    };
}

function mostra_foto(id) {
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    let imatge = new Image;
    if (id == 0) {
        seccio_origen = 2;
        document.getElementById("seccio_2").style.display = "none";
        imatge.src = document.getElementById("foto").src;
    }
    else {
        seccio_origen = 3;
        indexedDB.open("Dades").onsuccess = event => {
            event.target.result.transaction(["Fotos"], "readonly").objectStore("Fotos").get(id).onsuccess = event => {
                document.getElementById("seccio_3").style.display = "none";
                imatge.src = event.target.result["Foto"];
            }
        }
    }
    imatge.onload = () => {
        if (imatge.width > imatge.height) {
            canvas.width = imatge.height;
            canvas.height = imatge.width;
            context.translate(imatge.height, 0);
            context.rotate(Math.PI / 2);
        } else {
            canvas.width = imatge.width;
            canvas.height = imatge.height;
        }
        context.drawImage(imatge,0,0,imatge.width,imatge.height);
        document.getElementById("foto_gran").src = canvas.toDataURL("image/jpeg", 0.5);
    }
    document.getElementById("superior").classList.add("ocult");
    document.getElementById("menu").style.display = "none";
    document.getElementById("div_gran").style.display = "flex";
}

function omple_llista() {
    let llista = '';
    indexedDB.open("Dades").onsuccess = event => {
        event.target.result.transaction(["Fotos"], "readonly").objectStore("Fotos").index("Usuari_index").getAll(usuari).onsuccess = event => {
            dades = event.target.result;
            for (i in dades) {
                llista+= '<div class="llista_fila"><div><img src="';
                llista+= dades[i]["Foto"];
                llista+= '" onclick="mostra_foto(';
                llista+= dades[i]["ID"];
                llista+= ')" /></div><span>'; 
                llista+= dades[i]["Data"];
                llista+= '</span><i class="fa-solid fa-trash" onclick="esborra_foto(';
                llista+= dades[i]["ID"];
                llista+= ')"></i></div>';         
            }
            document.getElementById("llista_fotos").innerHTML = llista;
        }
    }
}

function esborra_foto(id) {
    let vull_esborrar = window.confirm("Vols esborrar la foto?");
    if (vull_esborrar) {
        indexedDB.open("Dades").onsuccess = event => {   
                event.target.result.transaction("Fotos", "readwrite").objectStore("Fotos").delete(id).onsuccess = () => {
                alert("La foto s'ha esborrat.");
                canvia_seccio(3);
            };
        };
    }
}

function retorn_a_seccio() {
    document.getElementById("superior").classList.remove("ocult");
    document.getElementById("menu").style.display = "flex";
    document.getElementById("div_gran").style.display = "none";
    if (seccio_origen == 2) {
        document.getElementById("seccio_2").style.display = "flex";
    } else {
        document.getElementById("seccio_3").style.display = "flex";
    }
}

function geoExit(posicio){
    let latitud = posicio.coords.latitude;
    let longitud = posicio.coords.longitude;
    if (typeof geoID === "undefined") {
        let pixels = 24;
        let mida = 2 * pixels;
        let ref_vertical = mida / 2;
        let color = "yellow";
        let path = "M12,1C10.89,1 10,1.9 10,3C10,4.11 10.89,5 12,5C13.11,5 14,4.11 14,3A2,2 0 0,0 12,1M10,6C9.73,6 9.5,6.11 9.31,6.28H9.3L4,11.59L5.42,13L9,9.41V22H11V15H13V22H15V9.41L18.58,13L20,11.59L14.7,6.28C14.5,6.11 14.27,6 14,6";
        let cadenaSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + pixels + ' ' + pixels + '"><path d="' + path + '" fill="' + color + '" /></svg>';
        let icona = encodeURI("data:image/svg+xml," + cadenaSVG);
        let icon = L.icon({
          iconUrl: icona,
          iconSize: [mida, mida],
          iconAnchor: [mida / 2, ref_vertical]
        }); 
        geoID = L.marker([latitud, longitud], {icon:icon, zIndexOffset:100, title:"Usuari"}).addTo(mapa);
    } else {
        geoID.setLatLng([latitud, longitud]);
    }
}

function format_data(date) {
    let any = date.getFullYear();
    let mes = (date.getMonth() + 1).toString();
    let dia = date.getDate().toString();
    let hora = date.getHours().toString();
    let minut = date.getMinutes().toString();
    let segon = date.getSeconds().toString();
    if (mes.length < 2) mes = '0' + mes;
    if (dia.length < 2) dia = '0' + dia;
    if (hora.length < 2) hora = '0' + hora;
    if (minut.length < 2) minut = '0' + minut;
    if (segon.length < 2) segon = '0' + segon;
    return dia + '/' + mes + '/' + any + ' - ' + hora + ':' + minut + ':' + segon;
}