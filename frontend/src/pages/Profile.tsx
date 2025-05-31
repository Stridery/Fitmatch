// src/pages/ProfilePage.tsx
import { useState } from "react";

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <h2 className="text-3xl font-bold mb-8">Your Profile</h2>

      <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center gap-6">
        <img
          src="https://via.placeholder.com/100"
          alt="avatar"
          className="w-24 h-24 rounded-full object-cover border border-gray-300"
        />

        <div className="flex-1 w-full space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">Name</Label>
            <Input
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">Email</Label>
            <Input
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled
              className="mt-1 w-full px-3 py-2 bg-gray-100 border rounded-md text-gray-500"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">Role</Label>
            <Input
              name="role"
              value={profile.role}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">Bio</Label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            onClick={handleUpdate}
            className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Update Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;