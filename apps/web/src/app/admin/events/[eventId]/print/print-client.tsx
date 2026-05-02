"use client";

import { useEffect } from "react";

export function PrintClient() {
  useEffect(() => {
    // Small delay to ensure images/QR codes are fully rendered
    const timeout = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
