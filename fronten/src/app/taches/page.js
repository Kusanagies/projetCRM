'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TachesPage() {
  const [taches, setTaches] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titre: '', description: '', type_tache: 'RAPPEL', date_echeance: '', contact: '' });
  
  // NOUVEAU : État pour afficher la vraie erreur
  const [submitError, setSubmitError] = useState(null); 

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    try {
      const tachesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taches/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!tachesRes.ok) throw new Error("Erreur de session");
      const tachesData = await tachesRes.json();
      setTaches(Array.isArray(tachesData) ? tachesData : (tachesData.results || []));

      const contactsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(Array.isArray(contactsData) ? contactsData : (contactsData.results || []));
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push('/login');
    }
  };

  useEffect(() => { fetchData(); }, [router]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null); // On réinitialise l'erreur
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taches/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          titre: formData.titre,
          description: formData.description,
          type_tache: formData.type_tache,
          date_echeance: formData.date_echeance,
          contact: formData.contact ? parseInt(formData.contact, 10) : null
        })
      });

      // LECTURE DE LA VRAIE ERREUR DJANGO
      if (!response.ok) {
        const errData = await response.json();
        let errorMsg = "Erreur de création";
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        }
        throw new Error(`Refusé : ${errorMsg}`);
      }
      
      setShowForm(false);
      setFormData({ titre: '', description: '', type_tache: 'RAPPEL', date_echeance: '', contact: '' });
      fetchData();
    } catch (err) { 
      setSubmitError(err.message); // On affiche l'erreur en rouge
    }
  };

  const toggleTerminee = async (tache) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taches/${tache.id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ est_terminee: !tache.est_terminee })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Supprimer cette tâche ?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/taches/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    fetchData();
  };

  const isEnRetard = (dateString) => {
    const dateEcheance = new Date(dateString);
    const maintenant = new Date();
    return dateEcheance < maintenant;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'APPEL': return '📞';
      case 'RDV': return '📅';
      case 'EMAIL': return '✉️';
      default: return '⏰';
    }
  };

  if (loading) return <div className="p-8">Chargement de votre agenda...</div>;

  const tachesAFaire = taches.filter(t => !t.est_terminee);
  const tachesTerminees = taches.filter(t => t.est_terminee);

  return (
    <main className="p-8 h-full flex flex-col relative overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda & Tâches</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos rappels, appels et rendez-vous</p>
        </div>
        <button onClick={() => {setShowForm(true); setSubmitError(null);}} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          + Planifier une tâche
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-bold text-gray-700 mb-4 flex items-center">
            À Faire <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{tachesAFaire.length}</span>
          </h2>
          <div className="space-y-4">
            {tachesAFaire.map(tache => (
              <div key={tache.id} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${isEnRetard(tache.date_echeance) ? 'border-red-500 bg-red-50' : 'border-blue-500'} border-t border-r border-b border-gray-100 flex justify-between`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{getTypeIcon(tache.type_tache)}</span>
                    <h3 className={`font-bold ${isEnRetard(tache.date_echeance) ? 'text-red-700' : 'text-gray-800'}`}>{tache.titre}</h3>
                    {isEnRetard(tache.date_echeance) && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded animate-pulse">EN RETARD</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Échéance : {new Date(tache.date_echeance).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  {tache.nom_contact && <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">👤 Concerne : {tache.nom_contact}</p>}
                  {tache.description && <p className="text-sm text-gray-500 italic mt-1">{tache.description}</p>}
                </div>
                <div className="flex flex-col items-end justify-between ml-4 space-y-2">
                  <button onClick={() => toggleTerminee(tache)} className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition" title="Marquer comme terminé">✓</button>
                  <button onClick={() => handleDelete(tache.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                </div>
              </div>
            ))}
            {tachesAFaire.length === 0 && <div className="text-gray-400 italic text-center py-8">Aucune tâche en attente. C'est l'heure du café !</div>}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-700 mb-4 flex items-center">
            Terminées <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{tachesTerminees.length}</span>
          </h2>
          <div className="space-y-4 opacity-70">
            {tachesTerminees.map(tache => (
              <div key={tache.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex justify-between">
                <div>
                  <h3 className="font-bold text-gray-500 line-through">{getTypeIcon(tache.type_tache)} {tache.titre}</h3>
                  <p className="text-xs text-gray-400 mt-1">Prévue le : {new Date(tache.date_echeance).toLocaleDateString('fr-FR')}</p>
                </div>
                <button onClick={() => toggleTerminee(tache)} className="text-sm text-blue-500 hover:underline">Rouvrir</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[400px]">
            <h2 className="text-xl font-bold mb-4">Planifier une tâche</h2>
            
            {/* AFFICHAGE DE L'ERREUR ICI */}
            {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">{submitError}</div>}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre de la tâche *</label>
                <input type="text" required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="Ex: Rappeler M. Dupont" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={formData.type_tache} onChange={e => setFormData({...formData, type_tache: e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="APPEL">📞 Appel</option>
                    <option value="RDV">📅 Rendez-vous</option>
                    <option value="EMAIL">✉️ Email</option>
                    <option value="RAPPEL">⏰ Rappel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date et heure *</label>
                  <input type="datetime-local" required value={formData.date_echeance} onChange={e => setFormData({...formData, date_echeance: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lier à un contact (Optionnel)</label>
                <select value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="">-- Aucun --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes / Description</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded px-3 py-2"></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Planifier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}