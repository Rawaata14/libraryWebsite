/*
=========================================================
ProfilePage.jsx

תיאור הקובץ:
דף הפרופיל הראשי של המשתמש במערכת.

תפקיד:
- מזהה את המשתמש המחובר.
- מנהל עדכון תמונת פרופיל.
- מציג דשבורד מתאים לפי role.
=========================================================
*/

import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ProfileHeader from "../components/profile/ProfileHeader";
import UserProfileDashboard from "../components/profile/UserProfileDashboard";
import LibrarianProfileDashboard from "../components/profile/LibrarianProfileDashboard";
import "../styles/profile.css";

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const isLibrarian = user?.role === "librarian";

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  /*
  ---------------------------------------------------------
  בחירת תמונת פרופיל

  תפקיד:
  שומר את קובץ התמונה שנבחר ומציג תצוגה מקדימה.
  ---------------------------------------------------------
  */
  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  /*
  ---------------------------------------------------------
  שמירת תמונת פרופיל

  תפקיד:
  שולח את התמונה לשרת לצורך שמירה ועדכון המשתמש.
  ---------------------------------------------------------
  */
  const handleSaveProfileImage = async () => {
    if (!selectedProfileImage) return;

    const formData = new FormData();
    formData.append("profileImage", selectedProfileImage);

    try {
      const response = await fetch("http://localhost:8000/user/profile-image", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile image updated successfully");
        window.location.reload();
      } else {
        alert(data.message || "Failed to update profile image");
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      alert("Server error while uploading profile image");
    }
  };

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
        />

        {isLibrarian ? <LibrarianProfileDashboard /> : <UserProfileDashboard />}
      </div>
    </div>
  );
}
