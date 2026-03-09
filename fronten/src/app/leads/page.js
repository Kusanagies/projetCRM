'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // États pour le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ titre: '', statut: 'NOUVEAU', valeur_estimee: '', contact: '' });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // États pour la modification / suppression
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editError, setEditError] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    try {
      const leadsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!leadsRes.ok) throw new Error("Session expirée");
      
      const leadsData = await leadsRes.json();
      if (Array.isArray(leadsData)) {
        setLeads(leadsData);
      } else if (leadsData && Array.isArray(leadsData.results)) {
        setLeads(leadsData.results);
      } else {
        setLeads([]);
      }

      const contactsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(Array.isArray(contactsData) ? contactsData : (contactsData.results || []));
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Erreur API:", err);
      setLoading(false);
      router.push('/login');
    }
  };

  useEffect(() => { fetchData(); }, [router]);

  // --- LOGIQUE DE CRÉATION ---
  const handleAddChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // --- CORRECTION DU BUG ICI ---
    if (!formData.contact || formData.contact === "") {
      setSubmitError("Veuillez sélectionner un contact dans la liste déroulante.");
      return;
    }

    // On force la conversion en nombre entier pour plaire à Django
    const contactId = parseInt(formData.contact, 10);
    
    if (isNaN(contactId)) {
      setSubmitError("L'identifiant du contact est invalide.");
      return;
    }
    // -----------------------------

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          titre: formData.titre,
          statut: formData.statut,
          valeur_estimee: formData.valeur_estimee !== '' ? parseFloat(formData.valeur_estimee) : null,
          contact: contactId // Envoi du nombre parfait
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        let errorMsg = "Erreur serveur";
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        }
        throw new Error(`Refusé : ${errorMsg}`);
      }

      setSubmitSuccess(true);
      fetchData();
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(false);
        setFormData({ titre: '', statut: 'NOUVEAU', valeur_estimee: '', contact: '' });
      }, 1500);
    } catch (err) { 
      setSubmitError(err.message); 
    }
  };

  // --- LOGIQUE DE MODIFICATION ET SUPPRESSION ---
  const handleEditChange = (e) => {
    setSelectedLead({ ...selectedLead, [e.target.name]: e.target.value });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    // Sécurité supplémentaire au cas où l'API renvoie le contact sous forme d'objet
    let contactId = selectedLead.contact;
    if (typeof contactId === 'object' && contactId !== null) {
      contactId = contactId.id;
    }
    contactId = parseInt(contactId, 10);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${selectedLead.id}/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          titre: selectedLead.titre,
          statut: selectedLead.statut,
          valeur_estimee: selectedLead.valeur_estimee !== '' && selectedLead.valeur_estimee !== null ? parseFloat(selectedLead.valeur_estimee) : null,
          contact: contactId 
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        let errorMsg = "Erreur de mise à jour";
        if (typeof errData === 'object') {
          errorMsg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        }
        throw new Error(`Refusé : ${errorMsg}`);
      }

      setShowEditModal(false);
      setSelectedLead(null);
      fetchData(); 
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette opportunité ?")) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error("Erreur de suppression");

      setShowEditModal(false);
      setSelectedLead(null);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const getLeadsByStatus = (status) => {
    if (!Array.isArray(leads)) return [];
    return leads.filter(lead => lead.statut === status);
  };

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
        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          + Ajouter un Lead
        </button>
      </div>

      {/* --- MODALE D'AJOUT --- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-96">
            <h2 className="text-xl font-bold mb-4">Nouvelle Opportunité</h2>
            
            {/* Message d'avertissement si aucun contact n'existe */}
            {contacts.length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded text-sm border border-yellow-200">
                ⚠️ Vous n'avez aucun contact. Allez d'abord dans l'onglet "Contacts" pour en créer un.
              </div>
            )}

            {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{submitError}</div>}
            {submitSuccess ? (
              <div className="py-8 text-center"><div className="text-green-600 text-xl font-bold mb-2">Succès !</div></div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input type="text" name="titre" required value={formData.titre} onChange={handleAddChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact associé *</label>
                  <select 
                    name="contact" 
                    required 
                    value={formData.contact} 
                    onChange={handleAddChange} 
                    className="w-full border rounded px-3 py-2 bg-white"
                    disabled={contacts.length === 0}
                  >
                    <option value="" disabled>Sélectionnez un contact</option>
                    {contacts.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (EUR)</label>
                  <input type="number" name="valeur_estimee" value={formData.valeur_estimee} onChange={handleAddChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut initial</label>
                  <select name="statut" value={formData.statut} onChange={handleAddChange} className="w-full border rounded px-3 py-2 bg-white">
                    <option value="NOUVEAU">Nouveau</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="CONVERTI">Converti</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                  <button 
                    type="submit" 
                    disabled={contacts.length === 0}
                    className={`px-4 py-2 text-white rounded shadow-sm ${contacts.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODALE DE MODIFICATION --- */}
      {showEditModal && selectedLead && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-96">
            <h2 className="text-xl font-bold mb-4">Modifier l'opportunité</h2>
            {editError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{editError}</div>}
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" name="titre" required value={selectedLead.titre} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (EUR)</label>
                <input type="number" name="valeur_estimee" value={selectedLead.valeur_estimee !== null ? selectedLead.valeur_estimee : ''} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut (Changer de colonne)</label>
                <select name="statut" value={selectedLead.statut} onChange={handleEditChange} className="w-full border rounded px-3 py-2 bg-white font-semibold text-blue-600">
                  <option value="NOUVEAU">Nouveau</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="CONVERTI">Converti (Gagné!)</option>
                  <option value="PERDU">Perdu</option>
                </select>
              </div>
              
              <div className="flex justify-between pt-4 border-t mt-6">
                <button type="button" onClick={() => handleDelete(selectedLead.id)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded font-medium">
                  Supprimer
                </button>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Mettre à jour</button>
                </div>
              </div>
            </form>
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
                      <button 
                        onClick={() => { setSelectedLead(lead); setShowEditModal(true); }}
                        className="text-blue-500 hover:underline font-medium"
                      >
                        [Modifier]
                      </button>
                    </div>
                  </div>
                ))}
                {getLeadsByStatus(colonne.id).length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-4 italic">Aucun lead</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}