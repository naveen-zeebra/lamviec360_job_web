"use client";
import { Button, Input, Select } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import ChipInput from "../components/ChipInput";
import { saveProfile } from "../../../../lib/seekerStore";

const WORK_MODES = ["Remote", "Hybrid", "On-site"];

export default function PreferencesTab({
  profile,
  persist,
  lang,
  t,
  setToast,
}) {
  return (
    <div className="flex flex-col gap-5">
      <ChipInput
        label={t(lang, "Preferred Roles")}
        values={profile.preferences.roles}
        placeholder={t(lang, "e.g. Senior Software Engineer")}
        onAdd={(v) =>
          persist({
            preferences: {
              ...profile.preferences,
              roles: [...profile.preferences.roles, v],
            },
          })
        }
        onRemove={(v) =>
          persist({
            preferences: {
              ...profile.preferences,
              roles: profile.preferences.roles.filter((x) => x !== v),
            },
          })
        }
      />
      <ChipInput
        label={t(lang, "Preferred Locations")}
        values={profile.preferences.locations}
        placeholder={t(lang, "e.g. Ho Chi Minh City")}
        allowSpecial={false}
        onAdd={(v) =>
          persist({
            preferences: {
              ...profile.preferences,
              locations: [...profile.preferences.locations, v],
            },
          })
        }
        onRemove={(v) =>
          persist({
            preferences: {
              ...profile.preferences,
              locations: profile.preferences.locations.filter((x) => x !== v),
            },
          })
        }
      />
      <div className="lv-form-grid">
        <Select
          label={t(lang, "Work Mode")}
          value={profile.preferences.workMode}
          onChange={(e) =>
            persist({
              preferences: { ...profile.preferences, workMode: e.target.value },
            })
          }
          options={WORK_MODES.map((v) => ({ value: v, label: t(lang, v) }))}
          placeholder={t(lang, "Select preferred work mode")}
        />
        <Input
          label={t(lang, "Desired Salary")}
          value={profile.preferences.salary}
          onChange={(e) =>
            persist({
              preferences: { ...profile.preferences, salary: e.target.value },
            })
          }
          placeholder={t(lang, "e.g. 35,000,000 VND")}
        />
      </div>
      <div className="mt-3 flex justify-end border-t border-line pt-5">
        <Button
          type="button"
          variant="primary"
          onClick={async () => {
            // Salary expectation must be within 1M-500M VND per month
            if (profile.preferences?.salary) {
              const raw = String(profile.preferences.salary).replace(/,/g, "").trim();
              let num = null;
              const matchM = raw.match(/(\d+(\.\d+)?)\s*M/i);
              if (matchM) {
                num = parseFloat(matchM[1]) * 1000000;
              } else {
                const matchNum = raw.match(/\d+/);
                if (matchNum) {
                  const parsed = parseFloat(matchNum[0]);
                  num = parsed < 1000 ? parsed * 1000000 : parsed;
                }
              }
              if (num !== null && (num < 1000000 || num > 500000000)) {
                setToast(t(lang, "Salary expectation must be between 1M and 500M VND per month"));
                return;
              }
            }
            await saveProfile(profile);
            setToast(t(lang, "Preferences saved!"));
          }}
        >
          <Icon name="check" size={16} />
          {t(lang, "Save Preferences")}
        </Button>
      </div>
    </div>
  );
}

