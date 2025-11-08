import { useState, useEffect } from "react";
import "./FeePayment.css";

export default function FeePayment() {
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [transactionDone, setTransactionDone] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [route, setRoute] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  // ✅ Get logged-in user details from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setStudentName(user.name || "Unknown Student");
      setStudentId(user.studentId || "N/A");
    }
  }, []);

  const handlePayment = (e) => {
    e.preventDefault();

    if (!route || !feeAmount) {
      alert("Please select both route and fee amount before proceeding.");
      return;
    }

    const ref = "TXN" + Math.floor(100000 + Math.random() * 900000);
    setReferenceId(ref);
    setTransactionDone(true);
  };

  const handleDownloadReceipt = () => {
    window.print(); // allows user to save as PDF
  };

  return (
    <div className="fee-payment-container">
      <div className="fee-header">
        <h1>💳 Transport Fee Payment</h1>
        <p>Pay your transport fees securely and download your digital receipt</p>
      </div>

      {!transactionDone ? (
        <div className="fee-payment-box">
          <div className="fee-summary">
            <h2>🧾 Payment Summary</h2>
            <p>
              <strong>Student Name:</strong> {studentName}
            </p>
            <p>
              <strong>Student ID:</strong> {studentId}
            </p>
            <p>
              <strong>Selected Route:</strong>{" "}
              {route || "Please select your route below"}
            </p>
            <p>
              <strong>Amount:</strong>{" "}
              {feeAmount ? `₹${feeAmount}` : "Please select fee amount below"}
            </p>
          </div>

          <form className="payment-form" onSubmit={handlePayment}>
            <h3>🚌 Select Bus Route</h3>
            <select
              className="input-field"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              required
            >
              <option value="">-- Select Your Route --</option>
              <option value="Guntur">Guntur</option>
              <option value="Chilakaluripeta">Chilakaluripeta</option>
              <option value="Bapatla">Bapatla</option>
              <option value="Vijayawada">Vijayawada</option>
              <option value="Tenali">Tenali</option>
              <option value="Ponnur">Ponnur</option>
              <option value="Mangalagiri">Mangalagiri</option>
              <option value="Sattenapalli">Sattenapalli</option>
              <option value="Apikatla">Apikatla</option>
            </select>

            <h3>💰 Select Fee Amount</h3>
            <select
              className="input-field"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              required
            >
              <option value="">-- Select Fee Amount --</option>
              {Array.from({ length: 70 }, (_, i) => (i + 1) * 1000).map(
                (amount) => (
                  <option key={amount} value={amount}>
                    ₹{amount}
                  </option>
                )
              )}
            </select>

            <h3>Select Payment Method</h3>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>📱 UPI (GPay / PhonePe / Paytm)</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>💳 Debit / Credit Card</span>
              </label>
            </div>

            {paymentMethod === "upi" ? (
              <input
                type="text"
                placeholder="Enter UPI ID (e.g., name@upi)"
                className="input-field"
                required
              />
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Card Number"
                  className="input-field"
                  required
                />
                <div className="card-details">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="input-field small"
                    required
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    className="input-field small"
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="pay-btn">
              Pay {feeAmount ? `₹${feeAmount}` : "Now"}
            </button>
          </form>
        </div>
      ) : (
        <div className="receipt-box" id="receipt">
          <h2>✅ Payment Successful!</h2>
          <p>
            Thank you, <strong>{studentName}</strong>
          </p>
          <div className="receipt-details">
            <p>
              <strong>Transaction ID:</strong> {referenceId}
            </p>
            <p>
              <strong>Student ID:</strong> {studentId}
            </p>
            <p>
              <strong>Route:</strong> {route}
            </p>
            <p>
              <strong>Amount Paid:</strong> ₹{feeAmount}
            </p>
            <p>
              <strong>Payment Method:</strong> {paymentMethod.toUpperCase()}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleString()}
            </p>
          </div>

          <div className="receipt-actions">
            <button onClick={handleDownloadReceipt} className="download-btn">
              📄 Download Receipt
            </button>
            <button
              className="new-payment-btn"
              onClick={() => setTransactionDone(false)}
            >
              Make Another Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
