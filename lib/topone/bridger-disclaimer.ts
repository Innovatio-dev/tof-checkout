const disclaimerMessage =
  "We advise you to use USDT (Tether) to make your payment and deposit immediately to minimize currency volatility.\n\n" +
  "The USD equivalent of your cryptocurrency deposit will be credited once it lands in the wallet address provided.\n\n" +
  "Please do not close this page until you've received payment confirmation.";

export const initBridgerPayDisclaimerListener = () => {
  const handler = ({ data }: MessageEvent) => {
    if (!data?.event || !data.event.startsWith("[bp]")) {
      return;
    }

    const iframeContainer = document.querySelector(".bp-checkout-container");

    const createDisclaimer = () => {
      if (!document.getElementById("custom-payment-disclaimer")) {
        const disclaimer = document.createElement("div");
        disclaimer.id = "custom-payment-disclaimer";
        disclaimer.style.background = "#222";
        disclaimer.style.color = "#fff";
        disclaimer.style.padding = "15px";
        disclaimer.style.marginBottom = "10px";
        disclaimer.style.borderRadius = "8px";
        disclaimer.style.fontSize = "14px";
        disclaimer.innerText = disclaimerMessage;

        if (iframeContainer?.parentNode) {
          iframeContainer.parentNode.insertBefore(disclaimer, iframeContainer);
        } else {
          console.error("Checkout container not found!");
        }
      }
    };

    const removeDisclaimer = () => {
      const existingDisclaimer = document.getElementById("custom-payment-disclaimer");
      if (existingDisclaimer) {
        existingDisclaimer.remove();
      }
    };

    if (data.event.includes("paymentMethodOpen")) {
      if (data.provider === "confirmo") {
        sessionStorage.setItem("providerSelected", "confirmo");
        setTimeout(createDisclaimer, 500);
      } else {
        sessionStorage.removeItem("providerSelected");
        removeDisclaimer();
      }
    }

    if (sessionStorage.getItem("providerSelected") === "confirmo") {
      setTimeout(createDisclaimer, 500);
    }
  };

  window.addEventListener("message", handler);

  return () => {
    window.removeEventListener("message", handler);
  };
};
