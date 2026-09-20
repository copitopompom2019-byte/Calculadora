const BCV_API_URL = "https://bcv.today/api/v1/rate.json";

const P2P_API_URL =
    "https://calculadora-bcv-api.copitopompom2019.workers.dev/p2p";

const ADJUSTMENT = 0.005;


// ========================================
// ELEMENTOS BCV
// ========================================

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


// ========================================
// TABS
// ========================================

const tabBcv = document.getElementById("tab-bcv");
const tabUsdt = document.getElementById("tab-usdt");

const bcvCalculator = document.getElementById("bcv-calculator");
const usdtCalculator = document.getElementById("usdt-calculator");


// ========================================
// ELEMENTOS USDT
// ========================================

const usdtBuyButton = document.getElementById("usdt-buy");
const usdtSellButton = document.getElementById("usdt-sell");

const usdtAmountLabel =
    document.getElementById("usdt-amount-label");

const usdtAmountInput =
    document.getElementById("usdt-amount");

const usdtCurrencySymbol =
    document.getElementById("usdt-currency-symbol");

const usdtResultElement =
    document.getElementById("usdt-result");

const usdtResultCurrencyElement =
    document.getElementById("usdt-result-currency");

const usdtPriceElement =
    document.getElementById("usdt-price");

const refreshUsdtButton =
    document.getElementById("refresh-usdt");

const usdtStatusMessage =
    document.getElementById("usdt-status-message");


// ========================================
// VARIABLES
// ========================================

let bcvRate = null;
let adjustedRate = null;

let conversionMode = "usd-to-bs";

let usdtTradeType = "buy";
let usdtPrice = null;

let usdtDebounceTimer = null;


// ========================================
// FORMATO DE NÚMEROS
// ========================================

function formatNumber(number, decimals = 2) {
    return new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}


// ========================================
// BCV
// ========================================

async function fetchBCVRate() {

    setStatus("Actualizando tasa BCV...");

    refreshButton.disabled = true;

    try {

        const response = await fetch(
            BCV_API_URL,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "No se pudo obtener la tasa BCV."
            );
        }

        const data = await response.json();

        const foundRate =
            typeof data?.USD === "number"
                ? data.USD
                : null;

        if (!foundRate || foundRate <= 0) {
            throw new Error(
                "La respuesta no contiene una tasa válida."
            );
        }

        bcvRate = foundRate;

        adjustedRate =
            bcvRate * (1 + ADJUSTMENT);

        window.bcvEffectiveDate =
            data?.effective_date || null;

        window.bcvUpdatedAt =
            data?.updated_at || null;

        updateRateDisplay();

        calculate();

        setStatus(
            "Tasa BCV actualizada correctamente."
        );

    } catch (error) {

        console.error(
            "Error obteniendo la tasa BCV:",
            error
        );

        setStatus(
            "No se pudo actualizar la tasa BCV. Comprueba tu conexión."
        );

    } finally {

        refreshButton.disabled = false;
    }
}


// ========================================
// MOSTRAR TASA BCV
// ========================================

function updateRateDisplay() {

    if (!bcvRate || !adjustedRate) {
        return;
    }

    bcvRateElement.textContent =
        `${formatNumber(bcvRate)} Bs/USD`;

    adjustedRateElement.textContent =
        `${formatNumber(adjustedRate)} Bs/USD`;

    if (window.bcvEffectiveDate) {

        const date =
            new Date(
                `${window.bcvEffectiveDate}T00:00:00`
            );

        lastUpdateElement.textContent =
            date.toLocaleDateString(
                "es-VE",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );

    } else {

        lastUpdateElement.textContent =
            "No disponible";
    }
}


// ========================================
// CALCULADORA BCV
// ========================================

function setConversionMode(mode) {

    conversionMode = mode;

    amountInput.value = "";

    resultElement.textContent = "0,00";

    if (mode === "usd-to-bs") {

        usdToBsButton.classList.add("active");

        bsToUsdButton.classList.remove("active");

        amountLabel.textContent =
            "Monto en USD";

        currencySymbol.textContent =
            "$";

        resultCurrencyElement.textContent =
            "Bs";

        amountInput.placeholder =
            "0,00";

    } else {

        usdToBsButton.classList.remove("active");

        bsToUsdButton.classList.add("active");

        amountLabel.textContent =
            "Monto en Bs";

        currencySymbol.textContent =
            "Bs";

        resultCurrencyElement.textContent =
            "USD";

        amountInput.placeholder =
            "0,00";
    }
}


function calculate() {

    const amount =
        parseFloat(amountInput.value);

    if (
        !adjustedRate ||
        !amount ||
        amount <= 0
    ) {

        resultElement.textContent =
            "0,00";

        return;
    }

    let result;

    if (conversionMode === "usd-to-bs") {

        result =
            amount * adjustedRate;

    } else {

        result =
            amount / adjustedRate;
    }

    resultElement.textContent =
        formatNumber(result);
}


function setStatus(message) {

    statusMessage.textContent =
        message;
}


// ========================================
// CAMBIO DE CALCULADORA
// ========================================

function showBCVCalculator() {

    tabBcv.classList.add("active");

    tabUsdt.classList.remove("active");

    bcvCalculator.classList.remove("hidden");

    usdtCalculator.classList.add("hidden");
}


function showUSDTCalculator() {

    tabBcv.classList.remove("active");

    tabUsdt.classList.add("active");

    bcvCalculator.classList.add("hidden");

    usdtCalculator.classList.remove("hidden");

    const amount =
        parseFloat(usdtAmountInput.value);

    if (
        amount &&
        amount > 0 &&
        !usdtPrice
    ) {
        fetchUSDTPrice();
    }
}


// ========================================
// USDT: COMPRA / VENTA
// ========================================

function setUSDTTradeType(type) {

    usdtTradeType = type;

    usdtPrice = null;

    usdtPriceElement.textContent =
        "--";

    usdtResultElement.textContent =
        "0,00";

    if (type === "buy") {

        usdtBuyButton.classList.add("active");

        usdtSellButton.classList.remove("active");

        usdtAmountLabel.textContent =
            "Monto en Bs";

        usdtCurrencySymbol.textContent =
            "Bs";

        usdtResultCurrencyElement.textContent =
            "USDT";

        usdtAmountInput.placeholder =
            "0,00";

    } else {

        usdtBuyButton.classList.remove("active");

        usdtSellButton.classList.add("active");

        usdtAmountLabel.textContent =
            "Monto en USDT";

        usdtCurrencySymbol.textContent =
            "USDT";

        usdtResultCurrencyElement.textContent =
            "Bs";

        usdtAmountInput.placeholder =
            "0,00";
    }

    usdtStatusMessage.textContent = "";

    const amount =
        parseFloat(usdtAmountInput.value);

    if (
        amount &&
        amount > 0
    ) {
        fetchUSDTPrice();
    }
}


// ========================================
// CONSULTAR PRECIO USDT P2P
// ========================================

async function fetchUSDTPrice() {

    const amount =
        parseFloat(usdtAmountInput.value);

    if (
        !amount ||
        amount <= 0
    ) {

        usdtPrice = null;

        usdtPriceElement.textContent =
            "--";

        usdtResultElement.textContent =
            "0,00";

        usdtStatusMessage.textContent =
            "Introduce un monto válido.";

        return;
    }

    refreshUsdtButton.disabled = true;

    usdtStatusMessage.textContent =
        "Buscando precio P2P...";

    try {

        const params =
            new URLSearchParams({
                amount: String(amount),
                type: usdtTradeType
            });

        const response =
            await fetch(
                `${P2P_API_URL}?${params.toString()}`,
                {
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.ok
        ) {

            usdtPrice = null;

            usdtPriceElement.textContent =
                "--";

            usdtResultElement.textContent =
                "0,00";

            usdtStatusMessage.textContent =
                data?.error ||
                "No encontramos una oferta P2P compatible.";

            return;
        }

        usdtPrice =
            Number(data.result.price);

        const result =
            Number(data.result.result);

        usdtPriceElement.textContent =
            `${formatNumber(usdtPrice)} Bs/USDT`;

        usdtResultElement.textContent =
            formatNumber(result);

        if (data.result.merchant) {

            usdtStatusMessage.textContent =
                `Precio de referencia P2P: ${data.result.merchant}.`;

        } else {

            usdtStatusMessage.textContent =
                "Precio P2P actualizado correctamente.";
        }

    } catch (error) {

        console.error(
            "Error consultando P2P:",
            error
        );

        usdtPrice = null;

        usdtPriceElement.textContent =
            "--";

        usdtResultElement.textContent =
            "0,00";

        usdtStatusMessage.textContent =
            "No se pudo consultar el precio P2P. Comprueba tu conexión.";

    } finally {

        refreshUsdtButton.disabled = false;
    }
}


// ========================================
// USDT: CAMBIO DE MONTO
// ========================================

function handleUSDTInput() {

    usdtPrice = null;

    usdtPriceElement.textContent =
        "--";

    usdtResultElement.textContent =
        "0,00";

    clearTimeout(usdtDebounceTimer);

    const amount =
        parseFloat(usdtAmountInput.value);

    if (
        !amount ||
        amount <= 0
    ) {

        usdtStatusMessage.textContent =
            "";

        return;
    }

    usdtStatusMessage.textContent =
        "Esperando monto...";

    usdtDebounceTimer =
        setTimeout(() => {

            fetchUSDTPrice();

        }, 500);
}


// ========================================
// EVENTOS BCV
// ========================================

usdToBsButton.addEventListener(
    "click",
    () => {
        setConversionMode("usd-to-bs");
    }
);

bsToUsdButton.addEventListener(
    "click",
    () => {
        setConversionMode("bs-to-usd");
    }
);

amountInput.addEventListener(
    "input",
    calculate
);

refreshButton.addEventListener(
    "click",
    fetchBCVRate
);


// ========================================
// EVENTOS TABS
// ========================================

tabBcv.addEventListener(
    "click",
    showBCVCalculator
);

tabUsdt.addEventListener(
    "click",
    showUSDTCalculator
);


// ========================================
// EVENTOS USDT
// ========================================

usdtBuyButton.addEventListener(
    "click",
    () => {
        setUSDTTradeType("buy");
    }
);

usdtSellButton.addEventListener(
    "click",
    () => {
        setUSDTTradeType("sell");
    }
);

usdtAmountInput.addEventListener(
    "input",
    handleUSDTInput
);

refreshUsdtButton.addEventListener(
    "click",
    fetchUSDTPrice
);


// ========================================
// INICIALIZACIÓN
// ========================================

setConversionMode(
    "usd-to-bs"
);

setUSDTTradeType(
    "buy"
);

showBCVCalculator();

fetchBCVRate();


// ========================================
// SERVICE WORKER
// ========================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        () => {

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

        }
    );
}
