/*
=========================================================
ProfileHeader.jsx

תיאור הקובץ:
קומפוננטת כותרת דף הפרופיל.

תפקיד:
- מציגה תמונת פרופיל.
- מציגה שם, אימייל ותפקיד.
- מאפשרת פתיחה וסגירה של עריכת תמונת פרופיל.
=========================================================
*/

/*
---------------------------------------------------------
בניית כתובת תמונת הפרופיל

תפקיד:
מחזירה תמונת משתמש מהשרת או תמונת ברירת מחדל.
---------------------------------------------------------
*/
function getProfileImageSrc(user) {
  if (user?.profile_image_name) {
    return `http://localhost:8000/uploads/profile-images/${user.profile_image_name}`;
  }

  if (user?.profileImage) {
    return user.profileImage;
  }

  return "https://cdn-icons-png.flaticon.com/512/847/847969.png";
}

export default function ProfileHeader({
  user,
  isLibrarian,
  isEditingProfile,
  setIsEditingProfile,
  selectedProfileImage,
  profileImagePreview,
  handleProfileImageChange,
  handleSaveProfileImage,
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
        </div>
      )}
    </>
  );
}
