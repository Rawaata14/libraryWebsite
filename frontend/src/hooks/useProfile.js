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
import { isValidEmail, isValidPassword } from "../utils/validators";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [imageSuccessMessage, setImageSuccessMessage] = useState("");

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

    setImageErrorMessage("");
    setImageSuccessMessage("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedProfileImage(null);
      setProfileImagePreview(null);

      event.target.value = "";

      setImageErrorMessage("Only image files are allowed");
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
    setImageErrorMessage("");
    setImageSuccessMessage("");

    if (!selectedProfileImage) {
      return;
    }

    try {
      const response = await updateProfileImage(selectedProfileImage);

      if (!response.data.success) {
        setImageErrorMessage(
          response.data.message || "Failed to update profile image",
        );
        return;
      }

      updateUser(response.data.user);

      setSelectedProfileImage(null);
      setProfileImagePreview(null);

      setImageSuccessMessage("Profile image updated successfully");
    } catch (error) {
      console.error("Profile image upload error:", error);

      setImageErrorMessage(
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
    setErrorMessage("");
    setSuccessMessage("");

    if (!profileForm.fullName.trim() || !profileForm.email.trim()) {
      setErrorMessage("Full name and email are required");
      return;
    }

    if (!isValidEmail(profileForm.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (profileForm.password !== profileForm.confirmPassword) {
      setErrorMessage("Password and confirm password do not match");
      return;
    }

    if (profileForm.password !== "" && !isValidPassword(profileForm.password)) {
      setErrorMessage(
        "Password must be 6-20 characters long and include at least one letter and one number.",
      );
      return;
    }

    try {
      const response = await updateProfileDetails({
        fullName: profileForm.fullName,
        email: profileForm.email,
        password: profileForm.password,
      });

      if (!response.data.success) {
        setErrorMessage(
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

      setSuccessMessage("Profile details updated successfully");
    } catch (error) {
      console.error("Profile details update error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Server error while updating profile details",
      );
    }
  };

  const handleCancelProfileEdit = () => {
    setProfileForm({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
    });

    setSelectedProfileImage(null);
    setProfileImagePreview(null);

    setErrorMessage("");
    setSuccessMessage("");
    setImageErrorMessage("");
    setImageSuccessMessage("");

    setIsEditingProfile(false);
  };

  return {
    isEditingProfile,
    setIsEditingProfile,
    handleCancelProfileEdit,
    selectedProfileImage,
    profileImagePreview,
    profileForm,
    handleProfileImageChange,
    handleSaveProfileImage,
    handleProfileFormChange,
    handleSaveProfileDetails,
    errorMessage,
    successMessage,
    imageErrorMessage,
    imageSuccessMessage,
  };
}
