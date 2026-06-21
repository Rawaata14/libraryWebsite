/*
=========================================================
ContactForm.jsx

תיאור הקובץ:
טופס יצירת קשר עבור משתמשי האתר.

הקובץ כולל:
- שדות שם, אימייל והודעה.
- שליחת הודעה לשרת.
- ניקוי הטופס אחרי שליחה מוצלחת.
=========================================================
*/

import { useState } from "react";

/*
---------------------------------------------------------
ContactForm

תפקיד:
מציג טופס לשליחת הודעה לספרייה ושולח את ההודעה ל-Backend.
---------------------------------------------------------
*/
export default function ContactForm() {
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSending, setIsSending] = useState(false);

  /*
  ---------------------------------------------------------
  handleContactChange

  תפקיד:
  מעדכן את שדות הטופס בזמן שהמשתמש מקליד.
  ---------------------------------------------------------
  */
  const handleContactChange = (field, value) => {
    setContact((prevContact) => ({
      ...prevContact,
      [field]: value,
    }));
  };

  /*
  ---------------------------------------------------------
  handleSubmitMessage

  תפקיד:
  שולח את ההודעה לשרת כדי שתישמר במסד הנתונים
  ותוצג לספרן בדף ההודעות.
  ---------------------------------------------------------
  */
  const handleSubmitMessage = async (event) => {
    event.preventDefault();

    setIsSending(true);

    try {
      const response = await fetch("http://localhost:8000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          senderName: contact.name,
          senderEmail: contact.email,
          messageText: contact.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Message sent successfully");

        setContact({
          name: "",
          email: "",
          message: "",
        });
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert("Server error while sending message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form className="contactForm" onSubmit={handleSubmitMessage}>
      <input
        type="text"
        placeholder="Your Name"
        value={contact.name}
        onChange={(event) => handleContactChange("name", event.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Your Email"
        value={contact.email}
        onChange={(event) => handleContactChange("email", event.target.value)}
        required
      />

      <textarea
        placeholder="Write your message..."
        rows="5"
        value={contact.message}
        onChange={(event) => handleContactChange("message", event.target.value)}
        required
      />

      <button type="submit" disabled={isSending}>
        {isSending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
