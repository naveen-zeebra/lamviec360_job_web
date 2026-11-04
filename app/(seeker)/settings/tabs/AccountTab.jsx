"use client";
import { Button, Input, PhoneInput } from "../../../../components/ds";
import Icon from "../../../../components/ds/Icon";
import { logout, resetAll } from "../../../../lib/seekerStore";

export default function AccountTab({
  auth,
  accountPhone,
  setAccountPhone,
  accountPhoneErr,
  setAccountPhoneErr,
  isSavingAccountPhone,
  handleSaveAccountPhone,
  pw,
  setPw,
  pwErr,
  submitPassword,
  confirmDelete,
  setConfirmDelete,
  router,
  lang,
  t,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="lv-form-grid">
        <div>
          <label
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t(lang, "Email")}
          </label>
          <p className="lv-file-chip" style={{ marginTop: 0 }}>
            <Icon name="mail" size={14} /> {auth?.email}
          </p>
        </div>
        <div>
          <PhoneInput
            id="accountPhone"
            name="accountPhone"
            label={t(lang, "Phone")}
            value={accountPhone}
            onChange={(phone) => {
              setAccountPhone(phone);
              setAccountPhoneErr("");
            }}
            error={accountPhoneErr}
            defaultCountry="vn"
          />
          <div style={{ marginTop: 10 }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isSavingAccountPhone}
              onClick={handleSaveAccountPhone}
            >
              <Icon name="phone" size={14} /> {t(lang, "Update Phone Number")}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <h3 style={{ marginBottom: 14 }}>{t(lang, "Change Password")}</h3>
        <div className="lv-form-grid">
          <Input
            label={t(lang, "Current password")}
            type="password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label={t(lang, "New password")}
            type="password"
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label={t(lang, "Confirm new password")}
            type="password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        {pwErr && (
          <p className="lv-error" role="alert" style={{ marginTop: 12 }}>
            <Icon name="alert-circle" size={16} />
            <span>{pwErr}</span>
          </p>
        )}
        <div style={{ marginTop: 12 }}>
          <Button variant="secondary" onClick={submitPassword}>
            {t(lang, "Update Password")}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          <Icon name="log-out" size={16} /> {t(lang, "Logout")}
        </Button>
      </div>
      <div className="border-t border-line pt-6">
        {!confirmDelete ? (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash-2" size={16} /> {t(lang, "Delete Account")}
          </Button>
        ) : (
          <div className="lv-error flex flex-col items-start gap-3" role="alert">
            <span>
              {t(
                lang,
                "This will permanently delete your profile, applications and saved jobs. This cannot be undone."
              )}
            </span>
            <div className="flex gap-2.5">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  resetAll();
                  router.push("/");
                }}
              >
                {t(lang, "Confirm Delete")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                {t(lang, "Cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

