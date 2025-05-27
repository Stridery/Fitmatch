// src/pages/ProfilePage.tsx
import { useState } from "react";
import "../styles/Profile.css";

function ProfilePage() {
  // Sample default data (can be fetched from API)
  const [profile, setProfile] = useState({
    name: "Alex Smith",
    email: "alex@example.com",
    role: "Student",
    bio: "Passionate about fitness and looking for a great coach.",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    // TODO: Call backend API to update profile
    alert("Profile updated successfully!");
    console.log("Updated Profile:", profile);
  };

  return (
    <div className="profile-page">
      <h2>Your Profile</h2>
      <div className="profile-card">
        <img
          src="https://via.placeholder.com/100"
          alt="avatar"
          className="profile-avatar"
        />

        <div className="profile-fields">
          <label>Name</label>
          <input name="name" value={profile.name} onChange={handleChange} />

          <label>Email</label>
          <input name="email" value={profile.email} onChange={handleChange} disabled />

          <label>Role</label>
          <input name="role" value={profile.role} onChange={handleChange} />

          <label>Bio</label>
          <textarea name="bio" value={profile.bio} onChange={handleChange} rows={4} />

          <button onClick={handleUpdate} className="update-btn">Update Profile</button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;