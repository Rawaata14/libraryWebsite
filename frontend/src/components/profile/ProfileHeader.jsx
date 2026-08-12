/*
=========================================================
ProfileHeader.jsx

תיאור הקובץ:
קומפוננטת כותרת דף הפרופיל.

הקובץ כולל:
- הצגת תמונת פרופיל.
- הצגת שם, אימייל ותפקיד.
- פתיחה וסגירה של אזור עריכת פרופיל.
- הצגת טופס עדכון תמונת פרופיל.
- הצגת טופס עדכון פרטים אישיים.
=========================================================
*/

import ProfileForm from "./ProfileForm";
import { getProfileImageSrc } from "../../utils/profileImage";

import PropTypes from "prop-types";

import {
  profileFormPropType,
  userPropType,
} from "../../propTypes/profilePropTypes";

/*
---------------------------------------------------------
ProfileHeader

תפקיד:
מציגה את אזור הפרטים העליון של המשתמש
ומנהלת את הצגת אזור העריכה.
---------------------------------------------------------
*/
export default function ProfileHeader({
  user,
  isLibrarian,
  isEditingProfile,
  setIsEditingProfile,
  selectedProfileImage,
  profileImagePreview,
  handleProfileImageChange,
  handleSaveProfileImage,
  profileForm,
  handleProfileFormChange,
  handleSaveProfileDetails,
}) {
  return (
    <>
      <div className="profileHeader">
        <img
          src={profileImagePreview || getProfileImageSrc(user)}
          alt="Profile"
          className="profileImage"
        />

        <div className="profileInfo">
          <h1>{user?.fullName || user?.name || "Library User"}</h1>

          <p className="profileEmail">{user?.email}</p>

          <span
            className={`profileRole ${
              isLibrarian ? "roleLibrarian" : "roleUser"
            }`}
          >
            {isLibrarian ? "Librarian" : "User"}
          </span>
        </div>

        <button
          type="button"
          className="editProfileButton"
          onClick={() => setIsEditingProfile((prev) => !prev)}
        >
          {isEditingProfile ? "Close Edit" : "Edit Profile"}
        </button>
      </div>

      {isEditingProfile && (
        <div className="profileEditPanel">
          <h3>Update Profile Image</h3>

          <div className="profileImagePreviewBox">
            <img
              src={profileImagePreview || getProfileImageSrc(user)}
              alt="Profile Preview"
            />
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
          />

          <button
            type="button"
            className="saveProfileButton"
            onClick={handleSaveProfileImage}
            disabled={!selectedProfileImage}
          >
            Save Profile Image
          </button>

          <div className="profileEditDivider" />

          <ProfileForm
            profileForm={profileForm}
            handleProfileFormChange={handleProfileFormChange}
            handleSaveProfileDetails={handleSaveProfileDetails}
          />
        </div>
      )}
    </>
  );
}

ProfileHeader.propTypes = {
  user: userPropType.isRequired,
  isLibrarian: PropTypes.bool.isRequired,
  isEditingProfile: PropTypes.bool.isRequired,
  setIsEditingProfile: PropTypes.func.isRequired,
  selectedProfileImage: PropTypes.instanceOf(File),
  profileImagePreview: PropTypes.string,
  handleProfileImageChange: PropTypes.func.isRequired,
  handleSaveProfileImage: PropTypes.func.isRequired,
  profileForm: profileFormPropType.isRequired,
  handleProfileFormChange: PropTypes.func.isRequired,
  handleSaveProfileDetails: PropTypes.func.isRequired,
};
