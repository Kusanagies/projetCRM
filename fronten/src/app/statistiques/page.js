'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function StatistiquesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // NOUVEAU : Pour capturer l'erreur exacte de Django
  const [serverError, setServerError] = useState(null); 

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/advanced-stats/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // MODIFICATION ICI : On lit le texte brut de l'erreur Django
        if (!response.ok) {
          const errText = await response.text();
          setServerError(errText);
          throw new Error("Crash du serveur Django");
        }
        
        const statsData = await response.json();
        setData(statsData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // AFFICHAGE DE L'ERREUR EN ROUGE SI DJANGO PLANTE
  if (serverError) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">🚨 Django a planté lors du calcul !</h1>
        <p className="mb-4 text-gray-700">Voici le message exact renvoyé par votre base de données :</p>
        <div className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-[500px] text-xs font-mono">
          {serverError.includes('<html') ? "Regardez l'onglet 'Console' (F12) ou l'onglet 'Réseau' de votre navigateur pour lire la page d'erreur complète." : serverError}
        </div>
      </div>
    );
  }

  if (loading || !data) return <div className="p-8 text-gray-500 font-medium">Calcul des rapports analytiques en cours...</div>;

  return (
    <main className="p-8 h-full flex flex-col overflow-y-auto bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Rapports & Statistiques</h1>
        <p className="text-gray-500 mt-1">Analyse détaillée de vos performances commerciales et de votre base clients</p>
      </div>

      {/* --- SECTION 1 : KPIs GLOBAUX --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-bold uppercase">CA Total (Gagné)</p>
          <p className="text-3xl font-black text-gray-800 mt-2">{data.kpis.ca_total.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Valeur du Pipeline</p>
          <p className="text-3xl font-black text-gray-800 mt-2">{data.kpis.valeur_pipeline.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-gray-400 mt-2">En cours de négociation</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Taux de Conversion</p>
          <p className="text-3xl font-black text-gray-800 mt-2">{data.kpis.taux_conversion} %</p>
          <p className="text-xs text-green-500 mt-2">Prospect → Client</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Panier Moyen</p>
          <p className="text-3xl font-black text-gray-800 mt-2">{data.kpis.panier_moyen.toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* --- SECTION 2 : GRAPHIQUES --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 mt-4">1. Statistiques Commerciales (Ventes)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Évolution du CA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">Évolution du Chiffre d'Affaires</h3>
          <div className="h-72 w-full">
            {data.evolution_ca.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolution_ca}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                  <XAxis dataKey="mois" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k€`}/>
                  <Tooltip formatter={(value) => `${value} €`} />
                  <Line type="monotone" dataKey="CA" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 italic">Pas assez de données de ventes</div>
            )}
          </div>
        </div>

        {/* CA par commercial */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">CA par Commercial</h3>
          <div className="h-72 w-full">
            {data.ca_par_commercial.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ca_par_commercial}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                  <XAxis dataKey="nom" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/>
                  <Tooltip formatter={(value) => `${value} €`} cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="CA" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-gray-400 italic">Aucune vente assignée</div>
            )}
          </div>
        </div>

        {/* Pipeline / Entonnoir */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">Répartition du Pipeline</h3>
          <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipeline_data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb"/>
                <XAxis type="number" stroke="#9ca3af" fontSize={12}/>
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.pipeline_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- SECTION 3 : STATISTIQUES CLIENTS --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 mt-4">2. Statistiques Clients</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* KPI Base Client */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="font-bold text-gray-700 mb-4">Base Clients</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Total Clients</span>
              <span className="font-bold text-lg">{data.kpis.total_clients}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Nouveaux (30j)</span>
              <span className="font-bold text-green-500">+ {data.kpis.nouveaux_clients}</span>
            </div>
          </div>
        </div>

        {/* Graphique Secteur */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
          <h3 className="font-bold text-gray-700 mb-2">Segmentation indicative</h3>
          <div className="h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.segmentation_secteur} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.segmentation_secteur.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </main>
  );
}