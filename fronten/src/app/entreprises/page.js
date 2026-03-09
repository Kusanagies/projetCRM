'use client';

import { useEffect, useState } from 'react';

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('fetch(process.env.NEXT_PUBLIC_API_URL + '/contacts/'')
      .then(res => res.json())
      .then(data => {
        setEntreprises(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur API:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Entreprises</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          + Nouvelle Entreprise
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement des entreprises...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">Nom de l'entreprise</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Secteur d'activité</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Site Web</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Date d'ajout</th>
              </tr>
            </thead>
            <tbody>
              {entreprises.map((entreprise) => (
                <tr key={entreprise.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{entreprise.nom}</td>
                  <td className="p-4 text-sm text-gray-600">{entreprise.secteur_activite || '-'}</td>
                  <td className="p-4 text-sm text-blue-500 hover:underline">
                    {entreprise.site_web ? <a href={entreprise.site_web} target="_blank" rel="noreferrer">[Lien] Visiter</a> : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(entreprise.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {entreprises.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">Aucune entreprise trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}