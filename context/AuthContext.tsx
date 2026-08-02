import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "admin" | "secretary" | "member";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  flatNumber?: string;
  phone: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const DEMO_USERS: (User & { password: string })[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Suresh Mehta",
    role: "admin",
    phone: "+91 98765 43210",
    email: "admin@greenvalleychs.com",
  },
  {
    id: "2",
    username: "secretary",
    password: "sec123",
    name: "Anita Sharma",
    role: "secretary",
    phone: "+91 87654 32109",
    email: "secretary@greenvalleychs.com",
  },
  {
    id: "3",
    username: "rajesh",
    password: "pass123",
    name: "Rajesh Kumar",
    role: "member",
    flatNumber: "A-101",
    phone: "+91 76543 21098",
    email: "rajesh@gmail.com",
  },
  {
    id: "4",
    username: "priya",
    password: "pass123",
    name: "Priya Patel",
    role: "member",
    flatNumber: "B-201",
    phone: "+91 65432 10987",
    email: "priya@gmail.com",
  },
  {
    id: "5",
    username: "amit",
    password: "pass123",
    name: "Amit Singh",
    role: "member",
    flatNumber: "C-301",
    phone: "+91 54321 09876",
    email: "amit@gmail.com",
  },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem("@current_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    setIsLoading(false);
  }

  async function login(username: string, password: string): Promise<boolean> {
    const found = DEMO_USERS.find(
      (u) => u.username === username.toLowerCase().trim() && u.password === password
    );
    if (!found) return false;
    const { password: _p, ...userData } = found;
    await AsyncStorage.setItem("@current_user", JSON.stringify(userData));
    setUser(userData);
    return true;
  }

  async function logout() {
    await AsyncStorage.removeItem("@current_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
