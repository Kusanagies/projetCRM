'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutomationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Onglets : 'regles' (sur événement) ou 'campagnes' (récurrent)
  const [activeTab, setActiveTab] = useState('regles');
  
  const [automations, setAutomations] = useState([]);
  const [campagnes, setCampagnes] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    try {
      // Charger les règles sur événement
      const resAuto = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/automations/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataAuto = await resAuto.json();
      setAutomations(Array.isArray(dataAuto) ? dataAuto : (dataAuto.results || []));

      // Charger les campagnes récurrentes
      const resCamp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campagnes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataCamp = await resCamp.json();
      setCampagnes(Array.isArray(dataCamp) ? dataCamp : (dataCamp.results || []));

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [router]);

  const handleCreateNew = () => {
    if (activeTab === 'regles') {
      setCurrentItem({ id: null, statut_declencheur: 'CONVERTI', actif: true, sujet: '', message: '' });
    } else {
      setCurrentItem({ id: null, titre: '', frequence: 'MENSUEL', actif: true, sujet: '', message: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    const endpoint = activeTab === 'regles' ? 'automations' : 'campagnes';
    const url = currentItem.id 
      ? `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/${currentItem.id}/` 
      : `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/`;

    const payload = { ...currentItem };
    if (!payload.id) delete payload.id;

    try {
      const response = await fetch(url, {
        method: currentItem.id ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Erreur de sauvegarde");
      setShowModal(false);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement ?')) return;
    const endpoint = activeTab === 'regles' ? 'automations' : 'campagnes';
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    setShowModal(false);
    fetchData();
  };

  const toggleActive = async (item) => {
    const endpoint = activeTab === 'regles' ? 'automations' : 'campagnes';
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${endpoint}/${item.id}/`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ actif: !item.actif })
    });
    fetchData();
  };

  // NOUVEAU : Fonction pour forcer l'envoi de masse immédiat
  const handleForceSend = async (id) => {
    if (!window.confirm('Attention : Cela va envoyer cet email à TOUS vos contacts. Continuer ?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campagnes/${id}/envoyer_maintenant/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await response.json();
      alert(data.message);
    } catch (err) { alert("Erreur lors de l'envoi"); }
  };

  if (loading) return <div className="p-8">Chargement du moteur d'automatisation...</div>;

  return (
    <main className="p-8 h-full flex flex-col relative overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Moteur d'Emailing</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos envois automatiques et vos newsletters</p>
        </div>
        <button onClick={handleCreateNew} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition font-medium">
          + Nouvelle {activeTab === 'regles' ? 'Règle' : 'Campagne'}
        </button>
      </div>

      {/* SYSTÈME D'ONGLETS */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button onClick={() => setActiveTab('regles')} className={`pb-3 px-2 font-bold text-sm transition-colors ${activeTab === 'regles' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
          ⚡ Sur Événement (Statut)
        </button>
        <button onClick={() => setActiveTab('campagnes')} className={`pb-3 px-2 font-bold text-sm transition-colors ${activeTab === 'campagnes' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
          📅 Campagnes Récurrentes
        </button>
      </div>

      <div className="grid gap-6">
        {/* AFFICHAGE DES RÈGLES */}
        {activeTab === 'regles' && automations.map(auto => (
          <div key={auto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between">
            <div className="flex-1">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">STATUT : {auto.statut_declencheur}</span>
              <h3 className="font-bold text-gray-800 text-lg mt-3">{auto.sujet}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-1">{auto.message}</p>
            </div>
            <div className="flex flex-col items-end space-y-4">
               <button onClick={() => toggleActive(auto)} className={`px-3 py-1 text-xs font-bold rounded ${auto.actif ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{auto.actif ? 'Actif' : 'Inactif'}</button>
               <button onClick={() => { setCurrentItem(auto); setShowModal(true); }} className="text-sm text-purple-600 hover:underline">Modifier</button>
            </div>
          </div>
        ))}

        {/* AFFICHAGE DES CAMPAGNES RÉCURRENTES */}
        {activeTab === 'campagnes' && campagnes.map(camp => (
          <div key={camp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">FRÉQUENCE : {camp.frequence}</span>
                <span className="font-black text-gray-800">{camp.titre}</span>
              </div>
              <h3 className="font-bold text-gray-600 text-md mt-3">Objet : {camp.sujet}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-1">{camp.message}</p>
            </div>
            <div className="flex flex-col items-end justify-between space-y-4">
               <button onClick={() => toggleActive(camp)} className={`px-3 py-1 text-xs font-bold rounded ${camp.actif ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{camp.actif ? 'Planifié' : 'En pause'}</button>
               <div className="flex space-x-4">
                 <button onClick={() => handleForceSend(camp.id)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-bold">🚀 Envoyer à TOUS maintenant</button>
                 <button onClick={() => { setCurrentItem(camp); setShowModal(true); }} className="text-sm text-purple-600 hover:underline">Modifier</button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE PARTAGÉE */}
      {showModal && currentItem && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Configurer</h2>
            {error && <div className="text-red-600 bg-red-50 p-3 mb-4">{error}</div>}
            
            <form onSubmit={handleSave} className="space-y-4">
              {activeTab === 'regles' ? (
                <select value={currentItem.statut_declencheur} onChange={e => setCurrentItem({...currentItem, statut_declencheur: e.target.value})} className="w-full border p-2 rounded">
                  <option value="NOUVEAU">Nouveau</option><option value="EN_COURS">En cours</option><option value="CONVERTI">Converti</option><option value="PERDU">Perdu</option>
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder="Nom interne (ex: Newsletter Météo)" value={currentItem.titre} onChange={e => setCurrentItem({...currentItem, titre: e.target.value})} className="border p-2 rounded" />
                  <select value={currentItem.frequence} onChange={e => setCurrentItem({...currentItem, frequence: e.target.value})} className="border p-2 rounded">
                    <option value="HEBDO">Chaque semaine</option><option value="MENSUEL">Chaque mois</option>
                  </select>
                </div>
              )}

              <input type="text" required placeholder="Objet de l'email" value={currentItem.sujet} onChange={e => setCurrentItem({...currentItem, sujet: e.target.value})} className="w-full border p-2 rounded" />
              <textarea required rows="6" placeholder="Bonjour {{contact.nom}}, ..." value={currentItem.message} onChange={e => setCurrentItem({...currentItem, message: e.target.value})} className="w-full border p-2 rounded"></textarea>
              
              <div className="flex justify-between pt-4">
                {currentItem.id ? <button type="button" onClick={() => handleDelete(currentItem.id)} className="text-red-500">Supprimer</button> : <div></div>}
                <div className="space-x-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Enregistrer</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}