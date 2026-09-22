import Badge from "../ds/Badge";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

const CONFIG = {
  Applied: { tone: "brand", icon: "send" },
  "Under Review": { tone: "warning", icon: "search" },
  Shortlisted: { tone: "brand", icon: "list-checks" },
  "Interview Scheduled": { tone: "warning", icon: "calendar" },
  "Offer Sent": { tone: "success", icon: "gift" },
  Hired: { tone: "success", icon: "check-circle" },
  Rejected: { tone: "error", icon: "x-circle" },
  Withdrawn: { tone: "neutral", icon: "undo-2" },
};

export default function StageBadge({ stage, lang }) {
  const cfg = CONFIG[stage] || CONFIG.Applied;
  return (
    <Badge tone={cfg.tone}>
      <Icon name={cfg.icon} size={11} /> {t(lang, stage)}
    </Badge>
  );
}
