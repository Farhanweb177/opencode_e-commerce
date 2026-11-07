// ============================================================
// MANUAL PAKISTANI PAYMENT CONFIGURATION
// ============================================================
// Apne account numbers yahan daalein — checkout page par yehi
// naazir hon ge (JazzCash, Easypaisa, bank transfer).
//
// Format guidelines:
//   * display: customer ko dikhne wala number
//   * accountTitle: account ka naam jis par transfer ho raha hai
// ============================================================

export type ManualPaymentMethod = {
  id: string;
  label: string;
  provider: string;
  display: string;
  accountTitle: string;
  instructions: string;
};

// PayPal/Card ONLINE payment disable hai — saath hi COD available.
export const ONLINE_DISABLED_MSG =
  "Online card/payment gateway abhi available nahi. COD ya apne manual (JazzCash/Easypaisa/Bank) account number se transfer karke order karein.";

export const MANUAL_PAYMENT_METHODS: ManualPaymentMethod[] = [
  {
    id: "jazzcash",
    label: "JazzCash",
    provider: "JazzCash",
    display: "0301-1424115",
    accountTitle: "All in One Store",
    instructions:
      "JazzCash app se receipt par order number zaroor likhein. Baad mein confirm karne ke liye receipt number bhi dein.",
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    provider: "Easypaisa",
    display: "0301-1424115",
    accountTitle: "All in One Store",
    instructions:
      "Easypaisa app se transfer karein aur order confirm karne ke liye receipt number provide karein.",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    provider: "Bank",
    display: "1234-5678-9012-3456",
    accountTitle: "All in One Store",
    instructions:
      "Bank transfer karne ke baad receipt number aur bank name likhein. Admin payment receive hone par order confirm karega.",
  },
];

// Programmatically ek method dhoondo — id ("jazzcash") ya checkout par
// use hone wala label ("JazzCash") dono accept karein.
export function getManualPaymentMethod(
  idOrLabel: string
): ManualPaymentMethod | undefined {
  const needle = idOrLabel.trim().toLowerCase();
  return MANUAL_PAYMENT_METHODS.find(
    (m) => m.id.toLowerCase() === needle || m.label.toLowerCase() === needle
  );
}
