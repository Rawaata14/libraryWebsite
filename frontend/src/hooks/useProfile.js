/*
=========================================================
useProfile.js

תיאור הקובץ:
Custom Hook לניהול עריכת פרופיל המשתמש.

ה-Hook אחראי על:
- סנכרון הטופס עם המשתמש המחובר.
- ניהול מצב פתיחת העריכה.
- בחירת תמונה ותצוגה מקדימה.
- שחרור כתובת התצוגה המקדימה מהזיכרון.
- שמירת תמונה ופרטים בשרת.
=========================================================
*/

import { useEffect, useState } from "react";

import {
  updateProfileDetails,
  updateProfileImage,
} from "../services/userService";

/*
---------------------------------------------------------
initialProfileForm

תפקיד:
מגדיר את ערכי ברירת המחדל של טופס הפרופיל.
---------------------------------------------------------
*/
const initialProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

/*
---------------------------------------------------------
useProfile

תפקיד:
מספק לדף הפרופיל את הנתונים והפעולות
הדרושים לעריכת המשתמש המחובר.
---------------------------------------------------------
*/
export default function useProfile({ user, updateUser }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [profileForm, setProfileForm] = useState(initialProfileForm);

  /*
  ---------------------------------------------------------
  סנכרון טופס הפרופיל

  תפקיד:
  מעדכן את פרטי הטופס כאשר נתוני המשתמש
  נטענים או משתנים ב-AuthContext.
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm((previousForm) => ({
      ...previousForm,
      fullName: user.fullName || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
    }));
  }, [user]);

  /*
  ---------------------------------------------------------
  ניקוי כתובת התצוגה המקדימה

  תפקיד:
  משחרר את כתובת ה-Blob כאשר התמונה משתנה
  או כאשר הקומפוננטה יורדת מהמסך.
  ---------------------------------------------------------
  */
  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  /*
  ---------------------------------------------------------
  handleProfileImageChange

  תפקיד:
  שומר את קובץ התמונה שנבחר ויוצר
  עבורו כתובת לתצוגה מקדימה.
  ---------------------------------------------------------
  */
  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    setSelectedProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  /*
  ---------------------------------------------------------
  handleSaveProfileImage

  תפקיד:
  שולחת את התמונה לשרת ומעדכנת
  את המשתמש ב-AuthContext לאחר הצלחה.
  ---------------------------------------------------------
  */
  const handleSaveProfileImage = async () => {
    if (!selectedProfileImage) {
      return;
    }

    try {
      const response = await updateProfileImage(selectedProfileImage);

      if (!response.data.success) {
        window.alert(response.data.message || "Failed to update profile image");
        return;
      }

      updateUser(response.data.user);

      setSelectedProfileImage(null);
      setProfileImagePreview(null);

      window.alert("Profile image updated successfully");
    } catch (error) {
      console.error("Profile image upload error:", error);

      window.alert(
        error.response?.data?.message ||
          "Server error while uploading profile image",
      );
    }
  };

  /*
  ---------------------------------------------------------
  handleProfileFormChange

  תפקיד:
  מעדכנת את שדה הטופס שהמשתמש שינה.
  ---------------------------------------------------------
  */
  const handleProfileFormChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  /*
  ---------------------------------------------------------
  handleSaveProfileDetails

  תפקיד:
  מאמתת את הסיסמאות, שולחת את פרטי
  המשתמש לשרת ומעדכנת את AuthContext.
  ---------------------------------------------------------
  */
  const handleSaveProfileDetails = async () => {
    if (profileForm.password !== profileForm.confirmPassword) {
      window.alert("Password and confirm password do not match");
      return;
    }

    try {
      const response = await updateProfileDetails({
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        password: profileForm.password,
      });

      if (!response.data.success) {
        window.alert(
          response.data.message || "Failed to update profile details",
        );
        return;
      }

      updateUser(response.data.user);

      setProfileForm((previousForm) => ({
        ...previousForm,
        password: "",
        confirmPassword: "",
      }));

      window.alert("Profile details updated successfully");
    } catch (error) {
      console.error("Profile details update error:", error);

      window.alert(
        error.response?.data?.message ||
          "Server error while updating profile details",
      );
    }
  };

  return {
    isEditingProfile,
    setIsEditingProfile,
    selectedProfileImage,
    profileImagePreview,
    profileForm,
    handleProfileImageChange,
    handleSaveProfileImage,
    handleProfileFormChange,
    handleSaveProfileDetails,
  };
}
