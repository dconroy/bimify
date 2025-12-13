interface PaymentGateProps {
  onPaymentStart: () => void;
  price?: string;
}

export function PaymentGate({ onPaymentStart, price = "$1.00" }: PaymentGateProps) {
  return (
    <div className="payment-gate">
      <div className="payment-content">
        <div className="payment-icon">🔒</div>
        <h3>Professional BIMI Vectorization</h3>
        <p>
          Unlock your professionally normalized, compliant SVG file and validation report.
        </p>
        <button onClick={onPaymentStart} className="pay-button">
          Purchase & Download for {price}
        </button>
        <p className="payment-secure">
          <span>🔒 Secure payment via Stripe</span>
        </p>
      </div>
    </div>
  );
}

