'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard-stats/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur de session');
        }

        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur API:', err);
        router.push('/login');
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 font-medium">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <main className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
        <p className="text-gray-500 mt-1">Bienvenue sur votre espace CRM Cloud</p>
      </div>

      {/* --- SECTION 1 : KPIs COMMERCIAUX --- */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">Performances Commerciales</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Chiffre d'Affaires</span>
          <span className="text-4xl font-black text-green-600">
            {stats?.ca_total ? `${stats.ca_total.toLocaleString('fr-FR')} €` : '0 €'}
          </span>
          <span className="text-xs text-green-500 mt-2 font-medium">↑ Basé sur les leads convertis</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Nouveaux Prospects</span>
          <span className="text-4xl font-black text-blue-600">{stats?.nouveaux_leads || 0}</span>
          <span className="text-xs text-gray-400 mt-2 font-medium">À contacter rapidement</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Affaires en cours</span>
          <span className="text-4xl font-black text-yellow-500">{stats?.leads_en_cours || 0}</span>
          <span className="text-xs text-gray-400 mt-2 font-medium">Dans le pipeline</span>
        </div>
      </div>

      {/* --- SECTION 2 : STATISTIQUES EMAILING (BREVO) --- */}
      <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
        <span>Campagnes Emailing (Brevo)</span>
        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Automatisé</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-lg border border-blue-100 shadow-sm">
          <div className="text-blue-500 text-sm font-bold mb-1">Emails Envoyés</div>
          <div className="text-2xl font-black text-gray-800">{stats?.email_stats?.envoyes || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-lg border border-green-100 shadow-sm">
          <div className="text-green-600 text-sm font-bold mb-1">Ouvertures</div>
          <div className="text-2xl font-black text-gray-800">{stats?.email_stats?.ouverts || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-lg border border-purple-100 shadow-sm">
          <div className="text-purple-600 text-sm font-bold mb-1">Clics uniques</div>
          <div className="text-2xl font-black text-gray-800">{stats?.email_stats?.clics || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-lg border border-red-100 shadow-sm">
          <div className="text-red-500 text-sm font-bold mb-1">Rebonds (Erreurs)</div>
          <div className="text-2xl font-black text-gray-800">{stats?.email_stats?.bounces || 0}</div>
        </div>
      </div>

      {/* --- SECTION 3 : DERNIERS CONTACTS --- */}
      <h2 className="text-lg font-bold text-gray-700 mb-4">Activité récente : Derniers contacts ajoutés</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {stats?.contacts_recents && stats.contacts_recents.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Nom complet</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Adresse Email</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Date d'ajout</th>
              </tr>
            </thead>
            <tbody>
              {stats.contacts_recents.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{contact.nom}</td>
                  <td className="p-4 text-gray-600 text-sm">{contact.email}</td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(contact.date_ajout).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500 italic">
            Aucun contact ajouté récemment.
          </div>
        )}
      </div>
    </main>
  );
}