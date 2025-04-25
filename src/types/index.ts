// src/types/index.ts
export enum Role {
    Admin = "Admin", 
    Mahasiswa = "Mahasiswa", 
    Guest = "Guest", 
    Pengurus_IOM = "Pengurus_IOM",
  }
  
export type User = {
  user_id: string; 
  name: string; 
  email: string; 
  password: string;
  role: Role;
}

export type Profile = {
  email: string; 
  password: string; 
  redirect: boolean; 
}