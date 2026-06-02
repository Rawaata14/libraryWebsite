/*
=========================================================
ProfilePage.jsx

תיאור הקובץ:
דף הפרופיל הראשי של המערכת.

הקובץ כולל:
- הצגת פרטי המשתמש המחובר.
- הצגת Dashboard למשתמש רגיל או לספרן.
- טעינת עדכונים דינמיים עבור הספרן.
- הצגת כרטיס הודעות ממשתמשים.
- אפשרות לפתוח אזור עריכת פרופיל.
- אפשרות לבחור תמונת פרופיל מהמחשב ולהעלות אותה לשרת.

הערה:
כדי שהעלאת התמונה תעבוד, צריך שב-Backend יהיה Route:
PUT http://localhost:8000/user/profile-image
=========================================================
*/

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/profile.css";

const DEFAULT_PROFILE_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/847/847969.png";

/*
---------------------------------------------------------
בניית כתובת תמונת הפרופיל

תפקיד:
מחזירה את תמונת הפרופיל הנכונה לפי הנתונים של המשתמש.
אם קיימת תמונה שהועלתה לשרת, היא מוצגת מתוך uploads.
אם לא קיימת תמונה, מוצגת תמונת ברירת מחדל.
---------------------------------------------------------
*/
function getProfileImageSrc(user) {
  if (user?.profile_image_name) {
    return `http://localhost:8000/uploads/profile-images/${user.profile_image_name}`;
  }

  if (user?.profileImage) {
    return user.profileImage;
  }

  return DEFAULT_PROFILE_IMAGE;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isLibrarian = user?.role === "librarian";

  /*
  ---------------------------------------------------------
  שמירת עדכוני Dashboard

  תפקיד:
  לשמור את ההתראות שמגיעות מהשרת ולהציג אותן
  מתחת לכרטיסי הניהול בדשבורד הספרן.
  ---------------------------------------------------------
  */
  const [stats, setStats] = useState({
    books: [],
    seats: [],
    users: [],
    reports: [],
    messages: [],
  });

  /*
  ---------------------------------------------------------
  מצב עריכת פרופיל

  תפקיד:
  קובע האם אזור עריכת הפרופיל פתוח או סגור.
  ---------------------------------------------------------
  */
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  /*
  ---------------------------------------------------------
  שמירת קובץ תמונת הפרופיל

  תפקיד:
  שומר את קובץ התמונה שנבחר מהמחשב לפני שליחתו לשרת.
  ---------------------------------------------------------
  */
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  /*
  ---------------------------------------------------------
  תצוגה מקדימה לתמונה

  תפקיד:
  מציג למשתמש את התמונה שנבחרה לפני השמירה.
  ---------------------------------------------------------
  */
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  /*
  ---------------------------------------------------------
  טעינת נתוני Dashboard של הספרן

  תפקיד:
  שולפת מהשרת עדכונים על ספרים, מקומות ישיבה,
  משתמשים, דוחות והודעות.

  במידה והשרת אינו זמין:
  מוצגים נתוני גיבוי זמניים כדי שהעמוד ימשיך לעבוד.
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!isLibrarian) return;

    const fetchLibrarianStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/librarian/dashboard-stats",
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (data.success) {
          setStats({
            books: data.stats.books || [],
            seats: data.stats.seats || [],
            users: data.stats.users || [],
            reports: data.stats.reports || [],
            messages: data.stats.messages || [],
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);

        setStats({
          books: [
            {
              text: "3 בקשות השאלת ספרים ממתינות",
              link: "/manage-books",
            },
          ],
          seats: [
            {
              text: "80% תפוסה בחדרי הלימוד",
              link: "/manage-seats",
            },
          ],
          users: [
            {
              text: "2 משתמשים חדשים נרשמו",
              link: "/manage-users",
            },
          ],
          reports: [
            {
              text: "הספר המבוקש ביותר: ההוביט",
              link: "/reports",
            },
          ],
          messages: [
            {
              text: "2 הודעות חדשות ממשתמשים",
              link: "/messages",
            },
          ],
        });
      }
    };

    fetchLibrarianStats();
  }, [isLibrarian]);

  /*
  ---------------------------------------------------------
  בחירת תמונת פרופיל מהמחשב

  תפקיד:
  מקבלת קובץ תמונה, שומרת אותו ב-state,
  ויוצרת preview להצגה לפני שמירה.
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
  שמירת תמונת פרופיל בשרת

  תפקיד:
  שולחת את תמונת הפרופיל ל-Backend בעזרת FormData.
  השרת שומר את הקובץ בתיקיית uploads ומעדכן את שם הקובץ ב-DB.
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

        {!isLibrarian ? (
          <div className="profileSection">
            <h2>My Activity</h2>

            <div className="profileGrid">
              <div className="profileBox" onClick={() => navigate("/my-books")}>
                <h3>📚 Borrowed Books</h3>
                <p>3 Active Books</p>
              </div>

              <div
                className="profileBox"
                onClick={() => navigate("/my-reservations")}
              >
                <h3>📅 Reservations</h3>
                <p>2 Active Reservations</p>
              </div>

              <div
                className="profileBox"
                onClick={() => navigate("/notifications")}
              >
                <h3>🔔 Notifications</h3>
                <p>No New Notifications</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="profileSection">
            <h2>Librarian Dashboard</h2>

            <div className="profileGrid librarianProfileGrid">
              <div
                className="profileBox"
                onClick={() => navigate("/manage-books")}
              >
                <h3>📖 Manage Books</h3>
                <p>Add / Edit / Remove Books</p>

                <div className="updatesContainer">
                  {stats.books.map((item, index) => (
                    <div
                      key={index}
                      className="updateNotification"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="profileBox"
                onClick={() => navigate("/manage-seats")}
              >
                <h3>🪑 Manage Seats</h3>
                <p>Control Library Map</p>

                <div className="updatesContainer">
                  {stats.seats.map((item, index) => (
                    <div
                      key={index}
                      className="updateNotification"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="profileBox"
                onClick={() => navigate("/manage-users")}
              >
                <h3>👥 Users Management</h3>
                <p>Manage Library Users</p>

                <div className="updatesContainer">
                  {stats.users.map((item, index) => (
                    <div
                      key={index}
                      className="updateNotification"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="profileBox" onClick={() => navigate("/reports")}>
                <h3>📊 Reports</h3>
                <p>Library Statistics & Reports</p>

                <div className="updatesContainer">
                  {stats.reports.map((item, index) => (
                    <div
                      key={index}
                      className="updateNotification"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="profileBox" onClick={() => navigate("/messages")}>
                <h3>✉️ Messages</h3>
                <p>Messages From Users</p>

                <div className="updatesContainer">
                  {stats.messages.map((item, index) => (
                    <div
                      key={index}
                      className="updateNotification"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
