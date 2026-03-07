'use client';

import { useEffect, useState } from 'react';

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/leads/')
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur API:", err);
        setLoading(false);
      });
  }, []);

  // Fonction pour filtrer les leads par statut
  const getLeadsByStatus = (status) => leads.filter(lead => lead.statut === status);

  const colonnes = [
    { id: 'NOUVEAU', titre: 'Nouveaux prospects', couleur: 'border-blue-500' },
    { id: 'EN_COURS', titre: 'En cours', couleur: 'border-yellow-500' },
    { id: 'CONVERTI', titre: 'Convertis', couleur: 'border-green-500' },
    { id: 'PERDU', titre: 'Perdus', couleur: 'border-red-500' }
  ];

  return (
    <main className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pipeline de Vente</h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des étapes du cycle de vente</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          + Ajouter un Lead
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Chargement du pipeline...</div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {colonnes.map((colonne) => (
            <div key={colonne.id} className="w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-lg p-4">
              <div className={`border-t-4 ${colonne.couleur} pt-2 mb-4 flex justify-between items-center`}>
                <h2 className="font-bold text-gray-700">{colonne.titre}</h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                  {getLeadsByStatus(colonne.id).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {getLeadsByStatus(colonne.id).map((lead) => (
                  <div key={lead.id} className="bg-white p-4 rounded shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{lead.titre}</h3>
                    {lead.valeur_estimee && (
                      <p className="text-green-600 font-bold text-sm mb-2">
                        {lead.valeur_estimee} EUR
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span>Ref Contact: #{lead.contact}</span>
                      <span>[Details]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}