import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/admin.css';
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      // Grab the token you saved during login
      const token = localStorage.getItem('access_token'); 
      
      if (!token) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      try {
        // Change this URL to match your actual Render backend URL
        const response = await fetch('https://ai-code-saftey-layer.onrender.com/auth/admin/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 403) {
          throw new Error("Access Denied: Admin privileges required.");
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data.");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Loading dashboard...</div>;
  
  if (error) return (
    <div className="text-center mt-20">
      <p className="text-red-500 font-bold text-xl">{error}</p>
      <button onClick={() => navigate('/')} className="mt-4 bg-zinc-800 text-white px-4 py-2 rounded">
        Return Home
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-zinc-300">
          <thead className="bg-zinc-800 text-zinc-100 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">{user.id}</td>
                <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-zinc-500">No users found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;