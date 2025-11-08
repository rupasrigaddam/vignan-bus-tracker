import { useState } from "react";
import "./FeedbackForm.css";

function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setName("");
      setEmail("");
      setMessage("");
    }
  };

  return (
    <div className="feedback-wrapper">
      {/* 🎨 Left Feedback Image Section */}
      <div className="feedback-visual">
        <div className="image-overlay"></div>
<img
  src="https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=1600&q=80"
  alt="People giving feedback and sharing opinions"
/>


        <div className="feedback-quote">
          <h2>💬 Share Your Thoughts</h2>
          <p>Your feedback makes our bus tracking smarter every day!</p>
        </div>
      </div>

      {/* 💬 Right Feedback Form Section */}
      <div className="feedback-form-area">
        <h1>We’d Love Your Feedback ✨</h1>
        <p>Help us enhance your campus bus experience with your valuable input!</p>

        {submitted ? (
          <div className="success-msg">✅ Thank you for your feedback!</div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea
              placeholder="Type your feedback here..."
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>

            <button type="submit">Submit Feedback 🚀</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackForm;
