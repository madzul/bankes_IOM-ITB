"use client";

import SidebarAdmin from "@/app/components/layout/sidebaradmin";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { User }  from "@/types/index";

export default function AccountPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});

  // Fetch users with role "Guest"
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/awaiting", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      data.forEach((user: User) => {
        user.user_id = user.user_id.toString(); // Ensure user_id is a string
      })

      setUsers(data); // Update the state with the fetched data

      const defaults: Record<string, string> = {};
      data.forEach((u: User) => { defaults[u.user_id] = "Pewawancara"; });
      setRoleMap(defaults);
      
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId: string, newRole: string) => {
    setRoleMap(prev => ({ ...prev, [userId]: newRole }));
  };

  
  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reject user");
      }

      fetchUsers();
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  const handleAccept = async (userId: string) => {
    try {
      const selectedRole = roleMap[userId];
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) throw new Error("Failed to accept user");
      fetchUsers();
    } catch (error) {
      console.error("Error accepting user:", error);
    }
  };

    return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarAdmin activeTab="account" />
      </div>
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Konfirmasi Akun Pengurus IOM</h1>
        <Card className="p-8 w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nama</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="border-b">
                  <td className="py-2">{user.name}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">
                    <select
                      value={roleMap[user.user_id]}
                      onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="Pengurus_IOM">Pengurus IOM</option>
                      <option value="Pewawancara">Pewawancara</option>
                    </select>
                  </td>
                  <td className="py-2 space-x-2">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => handleReject(user.user_id)}
                    >Tolak</button>
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded"
                      onClick={() => handleAccept(user.user_id)}
                    >Terima</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}