'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('access_token');
      
      // Si pas de token, on renvoie vers le login
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/dashboard-stats/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Session expirée ou non autorisée");
        }

        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        // En cas d'erreur de token, on nettoie et on redirige
        localStorage.removeItem('access_token');
        router.push('/login');
      }
    };

    fetchStats();
  }, [router]);

  if (loading) return <div className="p-8 text-gray-500">Chargement de vos indicateurs...</div>;
  if (error) return <div className="p-8 text-red-500">Erreur : {error}</div>;

  return (
    <main className="p-8 w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord intelligent</h1>
        <p className="text-gray-500 mt-1">Aperçu de vos performances commerciales</p>
      </header>

      {/* Cartes des KPI connectées à la BDD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI : Chiffre d'Affaires */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">CA Total (Gagné)</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.ca_total} EUR</p>
          <p className="text-green-500 text-sm mt-2 font-medium">Basé sur les leads convertis</p>
        </div>

        {/* KPI : Nouveaux Prospects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Nouveaux prospects</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.nouveaux_leads}</p>
          <p className="text-blue-500 text-sm mt-2 font-medium">Leads à qualifier</p>
        </div>

        {/* KPI : Affaires en cours */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Affaires en cours</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.leads_en_cours}</p>
          <p className="text-yellow-500 text-sm mt-2 font-medium">En cours de négociation</p>
        </div>

      </div>

      {/* Section Dynamique : Activité Récente */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Derniers contacts ajoutés</h2>
        
        {stats.contacts_recents.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stats.contacts_recents.map((contact) => (
              <div key={contact.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{contact.nom}</p>
                  <p className="text-sm text-gray-500">{contact.email}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(contact.date_ajout).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm bg-gray-50 p-8 rounded border border-dashed border-gray-200 text-center">
            Aucune activité récente.
          </div>
        )}
      </div>
    </main>
  );
}