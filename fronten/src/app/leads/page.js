'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // États pour le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ titre: '', statut: 'NOUVEAU', valeur_estimee: '' });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fonction pour charger les leads avec la sécurité JWT
  const fetchLeads = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Session expirée ou erreur d'accès");

      const data = await response.json();
      setLeads(data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur API:", err);
      setLoading(false);
      if (err.message.includes("Session")) {
        router.push('/login');
      }
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [router]);

  // --- LOGIQUE DE CRÉATION D'UN LEAD ---
  const handleAddChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titre: formData.titre,
          statut: formData.statut,
          valeur_estimee: formData.valeur_estimee ? parseFloat(formData.valeur_estimee) : 0
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du lead. Vérifiez les champs.");
      }

      setSubmitSuccess(true);
      fetchLeads(); // On recharge le tableau Kanban
      
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(false);
        setFormData({ titre: '', statut: 'NOUVEAU', valeur_estimee: '' });
      }, 1500);
      
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  // Configuration des colonnes du Kanban
  const getLeadsByStatus = (status) => leads.filter(lead => lead.statut === status);

  const colonnes = [
    { id: 'NOUVEAU', titre: 'Nouveaux prospects', couleur: 'border-blue-500' },
    { id: 'EN_COURS', titre: 'En cours', couleur: 'border-yellow-500' },
    { id: 'CONVERTI', titre: 'Convertis', couleur: 'border-green-500' },
    { id: 'PERDU', titre: 'Perdus', couleur: 'border-red-500' }
  ];

  return (
    <main className="p-8 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pipeline de Vente</h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des étapes du cycle de vente</p>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(true);
            setSubmitError(null);
            setSubmitSuccess(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Ajouter un Lead
        </button>
      </div>

      {/* --- MODALE D'AJOUT D'UN LEAD --- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-96">
            <h2 className="text-xl font-bold mb-4">Nouvelle Opportunité</h2>
            
            {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">{submitError}</div>}
            
            {submitSuccess ? (
              <div className="py-8 text-center">
                <div className="text-green-600 text-xl font-bold mb-2">Succès !</div>
                <p className="text-gray-600">Le lead a été ajouté au pipeline.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'opportunité *</label>
                  <input type="text" name="titre" required value={formData.titre} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" placeholder="Ex: Vente licences SaaS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (EUR)</label>
                  <input type="number" name="valeur_estimee" value={formData.valeur_estimee} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" placeholder="Ex: 5000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut initial</label>
                  <select name="statut" value={formData.statut} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white">
                    <option value="NOUVEAU">Nouveau</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="CONVERTI">Converti</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm">Enregistrer</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- VUE KANBAN --- */}
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
                    <p className="text-green-600 font-bold text-sm mb-2">
                      {lead.valeur_estimee ? `${lead.valeur_estimee} EUR` : 'Valeur non définie'}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span>[Ref: #{lead.id}]</span>
                      <span className="text-blue-500 hover:underline">[Voir]</span>
                    </div>
                  </div>
                ))}
                {getLeadsByStatus(colonne.id).length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-4 italic">
                    Aucun lead
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}