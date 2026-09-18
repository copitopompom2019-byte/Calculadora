/* =========================================
   CONFIGURACIÓN
========================================= */

// Fuente de la tasa BCV
const BCV_API_URL = "https://bcv.today/api/v1/rate.json";

// Ajuste que queremos aplicar a la tasa BCV
const ADJUSTMENT = 0.005;


/* =========================================
   ELEMENTOS DE LA INTERFAZ
========================================= */

const bcvRateElement = document.getElementById("bcv-rate");
const adjustedRateElement = document.getElementById("adjusted-rate");
const lastUpdateElement = document.getElementById("last-update");

const usdToBsButton = document.getElementById("usd-to-bs");
const bsToUsdButton = document.getElementById("bs-to-usd");

const amountLabel = document.getElementById("amount-label");
const amountInput = document.getElementById("amount");

const currencySymbol = document.getElementById("currency-symbol");

const resultElement = document.getElementById("result");
const resultCurrencyElement = document.getElementById("result-currency");

const refreshButton = document.getElementById("refresh-rate");
const statusMessage = document.getElementById("status-message");


/* =========================================
   VARIABLES
========================================= */

let bcvRate = null;
let adjustedRate = null;

let conversionMode = "usd-to-bs";


/* =========================================
   FORMATO DE NÚMEROS
========================================= */

function formatNumber(number, decimals = 2) {

    return new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);

}


/* =========================================
   OBTENER TASA BCV
========================================= */

async function fetchBCVRate() {

    setStatus("Actualizando tasa BCV...");

    refreshButton.disabled = true;

    try {

        const response = await fetch(BCV_API_URL, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("No se pudo obtener la tasa.");
        }

        const data = await response.json();

        /*
         * La API devuelve la tasa del dólar.
         * Intentamos localizarla en las propiedades
         * más habituales de la respuesta.
         */

        const foundRate =
    typeof data?.USD === "number"
        ? data.USD
        : null;

        if (!foundRate) {
            throw new Error("La respuesta no contiene una tasa válida.");
        }

        bcvRate = foundRate;

        /*
         * Aplicamos el 0,5 %.
         *
         * 0,5 % = 0,005
         *
         * Por tanto:
         *
         * tasa × 1,005
         */

        adjustedRate = bcvRate * (1 + ADJUSTMENT);

window.bcvEffectiveDate = data?.effective_date || null;
window.bcvUpdatedAt = data?.updated_at || null;

        updateRateDisplay();

        calculate();


        setStatus("Tasa actualizada correctamente.");

    } catch (error) {

        console.error("Error obteniendo la tasa BCV:", error);

        setStatus(
            "No se pudo actualizar la tasa BCV. Comprueba tu conexión."
        );

    } finally {

        refreshButton.disabled = false;

    }

}


/* =========================================
   MOSTRAR LA TASA
========================================= */

function updateRateDisplay() {

    if (!bcvRate || !adjustedRate) {
        return;
    }

    bcvRateElement.textContent =
        `${formatNumber(bcvRate)} Bs/USD`;

    adjustedRateElement.textContent =
        `${formatNumber(adjustedRate)} Bs/USD`;

    if (window.bcvEffectiveDate) {

    const date = new Date(
        `${window.bcvEffectiveDate}T00:00:00`
    );

    lastUpdateElement.textContent =
        date.toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

} else {

    lastUpdateElement.textContent = "No disponible";

}

}


/* =========================================
   CAMBIAR MODO DE CONVERSIÓN
========================================= */

function setConversionMode(mode) {

    conversionMode = mode;

    amountInput.value = "";

    resultElement.textContent = "0,00";


    if (mode === "usd-to-bs") {

        usdToBsButton.classList.add("active");
        bsToUsdButton.classList.remove("active");

        amountLabel.textContent = "Monto en USD";

        currencySymbol.textContent = "$";

        resultCurrencyElement.textContent = "Bs";

        amountInput.placeholder = "0,00";

    } else {

        usdToBsButton.classList.remove("active");
        bsToUsdButton.classList.add("active");

        amountLabel.textContent = "Monto en Bs";

        currencySymbol.textContent = "Bs";

        resultCurrencyElement.textContent = "USD";

        amountInput.placeholder = "0,00";

    }

}


/* =========================================
   REALIZAR CONVERSIÓN
========================================= */

function calculate() {

    const amount = parseFloat(amountInput.value);

    if (
        !adjustedRate ||
        !amount ||
        amount <= 0
    ) {

        resultElement.textContent = "0,00";

        return;
    }


    let result;


    if (conversionMode === "usd-to-bs") {

        /*
         * USD → Bs
         *
         * dólares × tasa
         */

        result = amount * adjustedRate;

    } else {

        /*
         * Bs → USD
         *
         * bolívares ÷ tasa
         */

        result = amount / adjustedRate;

    }


    /*
     * USD y Bs se muestran con 2 decimales
     */

    resultElement.textContent =
        formatNumber(result);

}


/* =========================================
   MENSAJE DE ESTADO
========================================= */

function setStatus(message) {

    statusMessage.textContent = message;

}


/* =========================================
   EVENTOS
========================================= */

usdToBsButton.addEventListener(
    "click",
    () => setConversionMode("usd-to-bs")
);

bsToUsdButton.addEventListener(
    "click",
    () => setConversionMode("bs-to-usd")
);

amountInput.addEventListener(
    "input",
    calculate
);

refreshButton.addEventListener(
    "click",
    fetchBCVRate
);


/* =========================================
   INICIALIZACIÓN
========================================= */

setConversionMode("usd-to-bs");

fetchBCVRate();
/* =========================================
   SERVICE WORKER
========================================= */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log(
                    "Service Worker registrado correctamente."
                );
            })
            .catch(error => {
                console.error(
                    "Error registrando Service Worker:",
                    error
                );
            });

    });

}
