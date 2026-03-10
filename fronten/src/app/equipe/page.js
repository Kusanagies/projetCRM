'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EquipePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // L'utilisateur actuellement connecté
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    try {
      // 1. On vérifie qui est connecté (pour bloquer la page si pas admin)
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meRes.json();
      setCurrentUser(meData);

      if (meData.role !== 'ADMIN') {
        setError("Accès refusé. Cette page est réservée aux administrateurs.");
        setLoading(false);
        return;
      }

      // 2. Si c'est un admin, on télécharge toute l'équipe
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipe/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!usersRes.ok) throw new Error("Erreur serveur");
      
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : (usersData.results || []));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [router]);

  // Fonction pour mettre à jour un employé
  const handleUpdateUser = async (userId, newRole, newIsActive) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipe/${userId}/`, {
        method: 'PATCH', // <-- LA CORRECTION MAGIQUE EST ICI (PATCH au lieu de PUT)
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          role: newRole,
          is_active: newIsActive
        })
      });

      // Affichage de la vraie erreur détaillée si Django refuse
      if (!response.ok) {
        const errData = await response.json();
        let errorMsg = "Erreur serveur";
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        }
        throw new Error(`Refusé par Django : ${errorMsg}`);
      }
      
      fetchUsers(); // On recharge le tableau
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Vérification de vos droits d'accès...</div>;

  if (error) return (
    <div className="p-8 h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center max-w-md">
        <span className="text-4xl block mb-4">⛔</span>
        <h2 className="font-bold text-xl mb-2">Accès Interdit</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/')} className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Retour au Dashboard</button>
      </div>
    </div>
  );

  return (
    <main className="p-8 h-full flex flex-col overflow-y-auto bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Gestion de l'équipe</h1>
        <p className="text-gray-500 mt-1">Gérez les rôles et les accès de vos collaborateurs (Espace Administrateur)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-4 text-sm font-semibold text-gray-600">Collaborateur</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Statut (Accès)</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Rôle CRM</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="font-bold text-gray-800">{user.username}</div>
                  {currentUser?.id === user.id && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2 font-bold">C'est vous</span>}
                </td>
                <td className="p-4 text-gray-600 text-sm">{user.email || 'Non renseigné'}</td>
                
                {/* GESTION DE L'ACCÈS */}
                <td className="p-4">
                  <button 
                    onClick={() => handleUpdateUser(user.id, user.role, !user.is_active)}
                    disabled={currentUser?.id === user.id} // On ne peut pas se désactiver soi-même !
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      user.is_active 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer'
                    } ${currentUser?.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {user.is_active ? '✅ Accès Actif' : '⛔ Compte Suspendu'}
                  </button>
                </td>

                {/* GESTION DU RÔLE */}
                
                <td className="p-4">
                  <select 
                    value={user.role || 'STANDARD'} // <-- LA CORRECTION EST ICI (ajout de || 'STANDARD')
                    disabled={currentUser?.id === user.id} // Un admin ne peut pas s'enlever ses propres droits
                    onChange={(e) => handleUpdateUser(user.id, e.target.value, user.is_active)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                    >
                    <option value="ADMIN">Administrateur</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="STANDARD">Standard (Lecture)</option>
                  </select>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}