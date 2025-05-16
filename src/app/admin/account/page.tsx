"use client";

import SidebarAdmin from "@/app/components/layout/sidebaradmin";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { User } from "@/types/index";
import Link from "next/link";

export default function AccountPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/all", {
        method: "GET"
      }
      );
      if(!response.ok) throw new Error("Failed to fetch users");

      const result = await response.json();
      if(!result.success) throw new Error(result.error || "Failed to fetch users");
      const data: User[] = result.data;
      setUsers(data);
      const defaults: Record<string, string> = {};
      data.forEach(u => { defaults[u.user_id.toString()] = u.role; });
      setRoleMap(defaults);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = (userId: string, newRole: string) => {
    setRoleMap(prev => ({ ...prev, [userId]: newRole }));
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
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
      if (!response.ok) throw new Error("Failed to update user role");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarAdmin activeTab="account" />
      </div>
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-4">Manage User Accounts</h1>
        <Card className="p-8 w-full">  
          <div className="flex gap-4 mb-4 justify-center">
            <input
              type="text"
              placeholder="Search name or email"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 flex-1 max-w-md"
            />
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="Pengurus_IOM">Pengurus IOM</option>
              <option value="Pewawancara">Pewawancara</option>
            </select>
          </div>
          <div className="overflow-x-auto px-4">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b">
                  {['Name','Email','Role','Actions'].map((col) => (
                    <th key={col} className="w-1/4 px-4 py-2 text-center align-center self-center items-center ">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(user => (
                  <tr key={user.user_id} className="border-b">
                    <td className="px-4 py-2 text-left">{user.name}</td>
                    <td className="px-4 py-2 text-left">{user.email}</td>
                    <td className="px-4 py-2 text-center">
                      {user.role === "Mahasiswa"
                        ? <span>{user.role}</span>
                        : <select
                            value={roleMap[user.user_id.toString()]}
                            onChange={e => handleRoleChange(user.user_id.toString(), e.target.value)}
                            className="border rounded px-2 py-1 cursor-pointer"
                          >
                            <option value="Pengurus_IOM">Pengurus IOM</option>
                            <option value="Pewawancara">Pewawancara</option>
                          </select>
                      }
                    </td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer hover:opacity-90"
                        onClick={() => handleReject(user.user_id.toString())}
                      >Delete</button>
                      {user.role !== "Mahasiswa" && (
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded cursor-pointer hover:opacity-90"
                          onClick={() => handleAccept(user.user_id.toString())}
                        >Update</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
            >Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
            >Next</button>
          </div>
        </Card>
      </div>
    </div>
  );
}