import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

interface IUser {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Current user:", currentUser);
        try {
          const token = await user.getIdToken();

          const res = await fetch("http://localhost:5000/api/users", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data: IUser[] = await res.json();
          setUsers(data);
        } catch (err: any) {
          setError(err.message || "Something went wrong");
        }
      } else {
        setError("No user is currently logged in.");
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Users</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {users.map((user) => (
          <li key={user.id || user.uid}>{user.name || user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
