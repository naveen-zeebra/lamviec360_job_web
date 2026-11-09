import Badge from "../ds/Badge";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";
import { getCanonicalStage } from "../../lib/seekerStore";

const CONFIG = {
  Applied: { tone: "brand", icon: "send" },
  Screening: { tone: "warning", icon: "search" },
  "Under Review": { tone: "warning", icon: "search" },
  "Phone Screening": { tone: "brand", icon: "phone-call" },
  Shortlisted: { tone: "brand", icon: "list-checks" },
  "Interview Scheduled": { tone: "warning", icon: "calendar" },
  "Offer Sent": { tone: "success", icon: "gift" },
  Hired: { tone: "success", icon: "check-circle" },
  "Post-Hire Tracking": { tone: "success", icon: "user-check" },
  Rejected: { tone: "error", icon: "x-circle" },
  Withdrawn: { tone: "neutral", icon: "undo-2" },
};

export default function StageBadge({ stage, lang }) {
  const canonical = getCanonicalStage(stage);
  const cfg = CONFIG[canonical] || CONFIG[stage] || CONFIG.Applied;
  return (
    <Badge tone={cfg.tone}>
      <Icon name={cfg.icon} size={11} /> {t(lang, canonical)}
    </Badge>
  );
}
