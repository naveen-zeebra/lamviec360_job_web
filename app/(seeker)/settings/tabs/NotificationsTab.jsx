"use client";
import { Select } from "../../../../components/ds";
import Switch from "../components/Switch";

export default function NotificationsTab({
  settings,
  persistSettings,
  lang,
  t,
  setToast,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ marginBottom: 4 }}>
        <h3 className="m-0 text-base font-bold text-ink">
          {t(lang, "Communication & Notification Language")}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {t(
            lang,
            "Choose your preferred language for automated recruitment emails, interview invitations, and status alerts."
          )}
        </p>
        <div style={{ maxWidth: 360, marginTop: 12 }}>
          <Select
            label={t(lang, "Preferred Email Language")}
            value={settings.preferred_language || "vi"}
            onChange={(e) => {
              const chosen = e.target.value;
              if (!chosen) return;
              persistSettings({ preferred_language: chosen });
              setToast(t(lang, "Notification language updated"));
            }}
            options={[
              { value: "vi", label: "Tiếng Việt (Vietnamese) — Mặc định" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
      </div>

      <div
        className="border-t border-line pt-4"
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        <h4 className="m-0 text-sm font-bold text-ink mb-2">
          {t(lang, "Email Alert Subscriptions")}
        </h4>
        <Switch
          label={t(lang, "Job recommendations")}
          on={settings.notifications?.jobRecs}
          onChange={(v) =>
            persistSettings({
              notifications: { ...settings.notifications, jobRecs: v },
            })
          }
        />
        <Switch
          label={t(lang, "Application updates")}
          on={settings.notifications?.appUpdates}
          onChange={(v) =>
            persistSettings({
              notifications: { ...settings.notifications, appUpdates: v },
            })
          }
        />
        <Switch
          label={t(lang, "Interview alerts")}
          on={settings.notifications?.interviewAlerts}
          onChange={(v) =>
            persistSettings({
              notifications: { ...settings.notifications, interviewAlerts: v },
            })
          }
        />
        <Switch
          label={t(lang, "Marketing emails")}
          on={settings.notifications?.marketing}
          onChange={(v) =>
            persistSettings({
              notifications: { ...settings.notifications, marketing: v },
            })
          }
        />
      </div>
    </div>
  );
}

