'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // États pour le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ nom: '', secteur_activite: '', site_web: '' });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fonction pour charger les entreprises avec la sécurité JWT
  const fetchEntreprises = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entreprises/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // On demande à React d'afficher le vrai statut renvoyé par Django (ex: 401, 404)
        console.error("Statut de l'erreur :", response.status);
        const errorText = await response.text();
        console.error("Message de Django :", errorText);
        throw new Error(`Erreur ${response.status} : Vérifiez la console.`);
      }

      const data = await response.json();
      setEntreprises(data);
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
    fetchEntreprises();
  }, [router]);

  // --- LOGIQUE DE CRÉATION D'UNE ENTREPRISE ---
  const handleAddChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entreprises/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de l'entreprise. Vérifiez vos champs.");
      }

      setSubmitSuccess(true);
      fetchEntreprises(); // Recharge la liste
      
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(false);
        setFormData({ nom: '', secteur_activite: '', site_web: '' });
      }, 1500);
      
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <main className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Entreprises</h1>
        <button 
          onClick={() => {
            setShowAddForm(true);
            setSubmitError(null);
            setSubmitSuccess(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Nouvelle Entreprise
        </button>
      </div>

      {/* --- MODALE D'AJOUT D'UNE ENTREPRISE --- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-96">
            <h2 className="text-xl font-bold mb-4">Ajouter une entreprise</h2>
            
            {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">{submitError}</div>}
            
            {submitSuccess ? (
              <div className="py-8 text-center">
                <div className="text-green-600 text-xl font-bold mb-2">Succès !</div>
                <p className="text-gray-600">L'entreprise a été ajoutée.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
                  <input type="text" name="nom" required value={formData.nom} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" placeholder="Ex: TechCorp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                  <input type="text" name="secteur_activite" value={formData.secteur_activite} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" placeholder="Ex: Informatique" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                  <input type="url" name="site_web" value={formData.site_web} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" placeholder="https://www..." />
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

      {/* --- TABLEAU DES ENTREPRISES --- */}
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