/*
=========================================================
ProfilePage.jsx

תיאור הקובץ:
דף הפרופיל הראשי של המשתמש במערכת.

העמוד אחראי על:
- קבלת המשתמש המחובר מ-AuthContext.
- חיבור טופס הפרופיל ל-useProfile.
- הצגת Dashboard לפי תפקיד המשתמש.

מצב העריכה ופעולות השמירה מנוהלים באמצעות:
useProfile
=========================================================
*/

import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

import ProfileHeader from "../components/profile/ProfileHeader";
import UserProfileDashboard from "../components/profile/UserProfileDashboard";
import LibrarianProfileDashboard from "../components/profile/LibrarianProfileDashboard";

import useProfile from "../hooks/useProfile";

import "../styles/profile.css";

/*
---------------------------------------------------------
ProfilePage

תפקיד:
מחברת בין המשתמש המחובר, לוגיקת עריכת
הפרופיל ורכיב ה-Dashboard המתאים לתפקידו.
---------------------------------------------------------
*/
export default function ProfilePage() {
  const { user, updateUser } = useContext(AuthContext);

  const isLibrarian = user?.role === "librarian";

  const {
    isEditingProfile,
    setIsEditingProfile,
    selectedProfileImage,
    profileImagePreview,
    profileForm,
    handleProfileImageChange,
    handleSaveProfileImage,
    handleProfileFormChange,
    handleSaveProfileDetails,
  } = useProfile({
    user,
    updateUser,
  });

  return (
    <div className="profilePage">
      <div className="profileCard">
        <ProfileHeader
          user={user}
          isLibrarian={isLibrarian}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          selectedProfileImage={selectedProfileImage}
          profileImagePreview={profileImagePreview}
          handleProfileImageChange={handleProfileImageChange}
          handleSaveProfileImage={handleSaveProfileImage}
          profileForm={profileForm}
          handleProfileFormChange={handleProfileFormChange}
          handleSaveProfileDetails={handleSaveProfileDetails}
        />

        {isLibrarian ? <LibrarianProfileDashboard /> : <UserProfileDashboard />}
      </div>
    </div>
  );
}
