/*
=========================================================
ProfilePage.jsx

תיאור הקובץ:
דף הפרופיל הראשי של המשתמש במערכת.

הקובץ כולל:
- זיהוי המשתמש המחובר.
- ניהול מצב עריכת הפרופיל.
- העלאת תמונת פרופיל לשרת.
- עדכון פרטים אישיים של המשתמש.
- הצגת Dashboard לפי סוג המשתמש: קורא / ספרן.
=========================================================
*/

import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ProfileHeader from "../components/profile/ProfileHeader";
import UserProfileDashboard from "../components/profile/UserProfileDashboard";
import LibrarianProfileDashboard from "../components/profile/LibrarianProfileDashboard";
import "../styles/profile.css";

/*
---------------------------------------------------------
ProfilePage

תפקיד:
קומפוננטת דף הפרופיל הראשית.
מנהלת את כל פעולות העריכה והעדכון של המשתמש.
---------------------------------------------------------
*/
export default function ProfilePage() {
  const { user, updateUser } = useContext(AuthContext);

  const isLibrarian = user?.role === "librarian";

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    password: "",
    confirmPassword: "",
  });

  /*
  ---------------------------------------------------------
  handleProfileImageChange

  תפקיד:
  שומר את קובץ תמונת הפרופיל שנבחר מהמחשב
  ומציג תצוגה מקדימה לפני השמירה.
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
  handleSaveProfileImage

  תפקיד:
  שולח את תמונת הפרופיל לשרת.
  השרת שומר את הקובץ ומעדכן את שם התמונה במסד הנתונים.
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
        updateUser(data.user);
        setSelectedProfileImage(null);
        setProfileImagePreview(null);
        alert("Profile image updated successfully");
      } else {
        alert(data.message || "Failed to update profile image");
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      alert("Server error while uploading profile image");
    }
  };

  /*
  ---------------------------------------------------------
  handleProfileFormChange

  תפקיד:
  מעדכן את שדות טופס הפרופיל בזמן שהמשתמש מקליד.
  ---------------------------------------------------------
  */
  const handleProfileFormChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  /*
  ---------------------------------------------------------
  handleSaveProfileDetails

  תפקיד:
  שולח את הפרטים האישיים המעודכנים לשרת.
  לאחר שמירה מוצלחת מעדכן את המשתמש ב-AuthContext.
  ---------------------------------------------------------
  */
  const handleSaveProfileDetails = async () => {
    if (profileForm.password !== profileForm.confirmPassword) {
      alert("Password and confirm password do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email,
          phone: profileForm.phone,
          address: profileForm.address,
          password: profileForm.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.user);

        setProfileForm((prevForm) => ({
          ...prevForm,
          password: "",
          confirmPassword: "",
        }));

        alert("Profile details updated successfully");
      } else {
        alert(data.message || "Failed to update profile details");
      }
    } catch (error) {
      console.error("Profile details update error:", error);
      alert("Server error while updating profile details");
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
          profileForm={profileForm}
          handleProfileFormChange={handleProfileFormChange}
          handleSaveProfileDetails={handleSaveProfileDetails}
        />

        {isLibrarian ? <LibrarianProfileDashboard /> : <UserProfileDashboard />}
      </div>
    </div>
  );
}
