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

  // --- DONNÉES SIMULÉES (En attendant de brancher Django) ---
  const evolutionCA = [
    { mois: 'Jan', CA: 12000 }, { mois: 'Fév', CA: 19000 }, { mois: 'Mar', CA: 15000 },
    { mois: 'Avr', CA: 22000 }, { mois: 'Mai', CA: 28000 }, { mois: 'Juin', CA: 35000 }
  ];

  const caParCommercial = [
    { nom: 'Alice', CA: 45000 }, { nom: 'Bob', CA: 32000 }, { nom: 'Charlie', CA: 54000 }
  ];

  const pipelineData = [
    { name: 'Prospect', value: 45 }, { name: 'Qualification', value: 30 },
    { name: 'Proposition', value: 20 }, { name: 'Négociation', value: 15 },
    { name: 'Gagné', value: 25 }
  ];

  const segmentationSecteur = [
    { name: 'Tech & IT', value: 40 }, { name: 'Immobilier', value: 25 },
    { name: 'Santé', value: 20 }, { name: 'Finance', value: 15 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) router.push('/login');
    else setLoading(false);
  }, [router]);

  if (loading) return <div className="p-8">Chargement des rapports analytiques...</div>;

  return (
    <main className="p-8 h-full flex flex-col overflow-y-auto bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Rapports & Statistiques</h1>
        <p className="text-gray-500 mt-1">Analyse détaillée de vos performances commerciales et de votre base clients</p>
      </div>

      {/* ==========================================
          SECTION 1 : KPIs GLOBAUX (Les gros chiffres)
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-bold uppercase">CA Total (Année)</p>
          <p className="text-3xl font-black text-gray-800 mt-2">131 000 €</p>
          <p className="text-xs text-green-500 mt-2 font-medium">↑ +14% vs N-1</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Valeur du Pipeline</p>
          <p className="text-3xl font-black text-gray-800 mt-2">85 400 €</p>
          <p className="text-xs text-gray-400 mt-2">Sur 135 opportunités</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Taux de Conversion</p>
          <p className="text-3xl font-black text-gray-800 mt-2">28.5 %</p>
          <p className="text-xs text-green-500 mt-2">Prospect → Client</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Panier Moyen</p>
          <p className="text-3xl font-black text-gray-800 mt-2">4 250 €</p>
          <p className="text-xs text-gray-400 mt-2">Délai moyen : 14 jours</p>
        </div>
      </div>

      {/* ==========================================
          SECTION 2 : GRAPHIQUES COMMERCIAUX
          ========================================== */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 mt-4">1. Statistiques Commerciales (Ventes)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Évolution du CA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">Évolution du Chiffre d'Affaires</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionCA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                <XAxis dataKey="mois" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k€`}/>
                <Tooltip formatter={(value) => `${value} €`} />
                <Line type="monotone" dataKey="CA" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CA par commercial */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">CA par Commercial</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caParCommercial}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                <XAxis dataKey="nom" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip formatter={(value) => `${value} €`} cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="CA" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline / Entonnoir */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">Répartition du Pipeline (Nb d'opportunités)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb"/>
                <XAxis type="number" stroke="#9ca3af" fontSize={12}/>
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECTION 3 : STATISTIQUES CLIENTS
          ========================================== */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 mt-4">2. Statistiques Clients & Segmentation</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* KPI Base Client */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="font-bold text-gray-700 mb-4">Base Clients</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Total Clients</span>
              <span className="font-bold text-lg">482</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Nouveaux (ce mois)</span>
              <span className="font-bold text-green-500">+ 34</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Clients Actifs</span>
              <span className="font-bold text-blue-600">315 (65%)</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-gray-500">LTV (Valeur à vie)</span>
              <span className="font-bold text-purple-600">12 400 €</span>
            </div>
          </div>
        </div>

        {/* Graphique Secteur */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
          <h3 className="font-bold text-gray-700 mb-2">Segmentation par Secteur d'activité</h3>
          <div className="h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentationSecteur} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {segmentationSecteur.map((entry, index) => (
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