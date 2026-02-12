"use client";

import { useEffect } from "react";

const HYROS_SCRIPT_ID = "hyros-universal-script";
const HYROS_SRC_BASE =
  "https://210146.t.hyros.com/v1/lst/universal-script?ph=4f47fd2b81bfe287f473b8cacaaa7fc5ec867d64e4095c61d3588fc61e196f06&tag=!clicked&ref_url=";

const HyrosScript = () => {
  useEffect(() => {
    if (document.getElementById(HYROS_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = HYROS_SCRIPT_ID;
    script.type = "text/javascript";
    script.src = `${HYROS_SRC_BASE}${encodeURI(document.URL)}`;
    document.head.appendChild(script);
  }, []);

  return null;
};

export default HyrosScript;
