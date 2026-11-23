import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import "../../styles/AlertMessage.css";

const alertIcons = {
  error: CircleAlert,
  success: CircleCheck,
  warning: TriangleAlert,
};

export default function AlertMessage({ type = "error", message }) {
  if (!message) return null;

  const Icon = alertIcons[type] || CircleAlert;

  return (
    <div
      className={`alertMessage alertMessage--${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      <Icon className="alertMessage__icon" aria-hidden="true" />
      <span className="alertMessage__text">{message}</span>
    </div>
  );
}
