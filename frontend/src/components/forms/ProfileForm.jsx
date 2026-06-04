/*
=========================================================
ProfileForm.jsx

תיאור הקובץ:
טופס עריכת הפרטים האישיים של המשתמש.

הקובץ כולל:
- עריכת שם מלא.
- עריכת אימייל.
- עריכת טלפון.
- עדכון סיסמה חדשה.
- אישור סיסמה.
=========================================================
*/

/*
---------------------------------------------------------
ProfileForm

תפקיד:
מציג שדות לעריכת פרטי המשתמש
ומפעיל שמירה כאשר המשתמש לוחץ על Save Details.
---------------------------------------------------------
*/
export default function ProfileForm({
  profileForm,
  handleProfileFormChange,
  handleSaveProfileDetails,
}) {
  return (
    <div className="profileDetailsForm">
      <h3>Personal Details</h3>

      <div className="profileDetailsGrid">
        <div className="profileField">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            value={profileForm.fullName}
            onChange={handleProfileFormChange}
            placeholder="Enter your full name"
          />
        </div>

        <div className="profileField">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profileForm.email}
            onChange={handleProfileFormChange}
            placeholder="Enter your email"
          />
        </div>

        <div className="profileField">
          <label>Phone Number</label>
          <input
            type="text"
            name="phone"
            value={profileForm.phone}
            onChange={handleProfileFormChange}
            placeholder="Enter your phone number"
          />
        </div>


        <div className="profileField">
          <label>New Password</label>
          <input
            type="password"
            name="password"
            value={profileForm.password}
            onChange={handleProfileFormChange}
            placeholder="Enter new password"
          />
        </div>

        <div className="profileField">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={profileForm.confirmPassword}
            onChange={handleProfileFormChange}
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <button
        type="button"
        className="saveProfileButton"
        onClick={handleSaveProfileDetails}
      >
        Save Details
      </button>
    </div>
  );
}
