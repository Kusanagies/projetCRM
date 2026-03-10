'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutomationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Pour l'instant, on simule les données en local (le temps de faire le backend Django)
  const [automations, setAutomations] = useState([
    {
      id: 1,
      statut_declencheur: 'NOUVEAU',
      actif: true,
      sujet: 'Bienvenue dans notre réseau !',
      message: 'Bonjour {{contact.nom}},\n\nNous avons bien pris en compte votre demande concernant : {{lead.titre}}.\nUn conseiller va vous contacter rapidement.\n\nCordialement,'
    },
    {
      id: 2,
      statut_declencheur: 'CONVERTI',
      actif: true,
      sujet: 'Félicitations pour notre collaboration',
      message: 'Bonjour {{contact.nom}},\n\nNous sommes ravis de démarrer ce projet ({{lead.titre}}) avec vous !\nVoici les prochaines étapes...\n\nA très vite,'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentAuto, setCurrentAuto] = useState(null);

  useEffect(() => {
    // Vérification de la sécurité classique
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleEdit = (auto) => {
    setCurrentAuto({ ...auto });
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setCurrentAuto({
      id: Date.now(), // ID temporaire
      statut_declencheur: 'EN_COURS',
      actif: true,
      sujet: '',
      message: ''
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Si l'ID existe déjà, on met à jour, sinon on ajoute
    const exists = automations.find(a => a.id === currentAuto.id);
    if (exists) {
      setAutomations(automations.map(a => a.id === currentAuto.id ? currentAuto : a));
    } else {
      setAutomations([...automations, currentAuto]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Voulez-vous supprimer cette automatisation ?')) {
      setAutomations(automations.filter(a => a.id !== id));
      setShowModal(false);
    }
  };

  const toggleActive = (id) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, actif: !a.actif } : a
    ));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'NOUVEAU': return 'bg-blue-100 text-blue-700';
      case 'EN_COURS': return 'bg-yellow-100 text-yellow-700';
      case 'CONVERTI': return 'bg-green-100 text-green-700';
      case 'PERDU': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <main className="p-8 h-full flex flex-col relative overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Automations Emails</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les emails envoyés automatiquement selon le statut des Leads</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition font-medium"
        >
          + Nouvelle Règle
        </button>
      </div>

      <div className="grid gap-6">
        {automations.map(auto => (
          <div key={auto.id} className={`bg-white rounded-xl shadow-sm border ${auto.actif ? 'border-purple-200' : 'border-gray-200 opacity-60'} p-6 flex items-start justify-between transition-all`}>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(auto.statut_declencheur)}`}>
                  SI LE STATUT DEVIENT : {auto.statut_declencheur}
                </span>
                <span className="text-gray-400 text-sm">→</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold flex items-center">
                  ✉️ ENVOYER UN EMAIL
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">{auto.sujet}</h3>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2 whitespace-pre-wrap">{auto.message}</p>
            </div>
            
            <div className="flex flex-col items-end space-y-4 ml-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={auto.actif} onChange={() => toggleActive(auto.id)} />
                  <div className={`block w-10 h-6 rounded-full transition ${auto.actif ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${auto.actif ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-gray-700">{auto.actif ? 'Actif' : 'Inactif'}</div>
              </label>
              
              <button 
                onClick={() => handleEdit(auto)}
                className="text-sm text-purple-600 font-semibold hover:underline"
              >
                Modifier le modèle
              </button>
            </div>
          </div>
        ))}
        {automations.length === 0 && (
          <div className="text-center p-10 text-gray-500 border-2 border-dashed rounded-xl">
            Aucune automatisation configurée.
          </div>
        )}
      </div>

      {/* --- MODALE D'ÉDITION --- */}
      {showModal && currentAuto && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Configurer l'automatisation</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Déclencheur (Nouveau statut du Lead)</label>
                  <select 
                    value={currentAuto.statut_declencheur}
                    onChange={(e) => setCurrentAuto({...currentAuto, statut_declencheur: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  >
                    <option value="NOUVEAU">Nouveau</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="CONVERTI">Converti</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-800 font-medium mb-2">💡 Variables magiques disponibles :</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">{'{{contact.nom}}'}</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">{'{{lead.titre}}'}</span>
                    <span className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">{'{{lead.valeur}}'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Objet de l'email</label>
                  <input 
                    type="text" 
                    required
                    value={currentAuto.sujet}
                    onChange={(e) => setCurrentAuto({...currentAuto, sujet: e.target.value})}
                    placeholder="Ex: Mise à jour de votre dossier"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Corps du message</label>
                  <textarea 
                    required
                    rows="8"
                    value={currentAuto.message}
                    onChange={(e) => setCurrentAuto({...currentAuto, message: e.target.value})}
                    placeholder="Tapez votre message ici..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-sans"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => handleDelete(currentAuto.id)}
                  className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition"
                >
                  Supprimer
                </button>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition shadow-md"
                  >
                    Enregistrer l'automatisation
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}