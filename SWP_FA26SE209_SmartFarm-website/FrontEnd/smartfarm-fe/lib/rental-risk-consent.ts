const rentalRiskConsentKey = "smartfarm:rental-risk-consent";

export function rememberRentalRiskConsent(accepted: boolean) {
  if (typeof window === "undefined") return;
  if (accepted) window.sessionStorage.setItem(rentalRiskConsentKey, "accepted");
  else window.sessionStorage.removeItem(rentalRiskConsentKey);
}

export function consumeRentalRiskConsent() {
  if (typeof window === "undefined") return false;
  const accepted = window.sessionStorage.getItem(rentalRiskConsentKey) === "accepted";
  window.sessionStorage.removeItem(rentalRiskConsentKey);
  return accepted;
}
