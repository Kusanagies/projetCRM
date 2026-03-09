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
  const [isNewContact, setIsNewContact] = useState(false); 
  const [formData, setFormData] = useState({ 
    titre: '', statut: 'NOUVEAU', valeur_estimee: '', contact: '',
    newContactNom: '', newContactEmail: '', newContactTelephone: ''
  });
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

  // ==========================================
  // NOUVEAU : LOGIQUE DE DRAG AND DROP
  // ==========================================
  
  // 1. Quand on attrape une carte
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId.toString());
  };

  // 2. Pour autoriser le dépôt sur une colonne
  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  // 3. Quand on lâche la carte dans une nouvelle colonne
  const handleDrop = async (e, nouveauStatut) => {
    e.preventDefault();
    const leadIdStr = e.dataTransfer.getData('leadId');
    if (!leadIdStr) return;

    const leadId = parseInt(leadIdStr, 10);
    const leadDeplace = leads.find(l => l.id === leadId);

    // Si on lâche dans la même colonne, on ne fait rien
    if (!leadDeplace || leadDeplace.statut === nouveauStatut) return;

    // Mise à jour visuelle instantanée (Optimistic UI) pour que ce soit fluide
    const leadsMisesAJour = leads.map(l => 
      l.id === leadId ? { ...l, statut: nouveauStatut } : l
    );
    setLeads(leadsMisesAJour);

    // Envoi de la requête à Django en arrière-plan
    let contactId = leadDeplace.contact;
    if (typeof contactId === 'object' && contactId !== null) {
      contactId = contactId.id;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          titre: leadDeplace.titre,
          statut: nouveauStatut, // Le fameux nouveau statut !
          valeur_estimee: leadDeplace.valeur_estimee !== '' && leadDeplace.valeur_estimee !== null ? parseFloat(leadDeplace.valeur_estimee) : null,
          contact: parseInt(contactId, 10)
        }),
      });

      if (!response.ok) throw new Error("Erreur de sauvegarde lors du déplacement");
    } catch (err) {
      console.error(err);
      alert("Le serveur n'a pas pu enregistrer le déplacement.");
      fetchData(); // En cas d'erreur, on recharge les vraies données
    }
  };

  // ==========================================

  // --- LOGIQUE DE CRÉATION ---
  const handleAddChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const token = localStorage.getItem('access_token');
    let finalContactId = null;

    try {
      if (isNewContact) {
        if (!formData.newContactNom || !formData.newContactEmail) {
          throw new Error("Le nom et l'email du nouveau contact sont obligatoires.");
        }

        const contactRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nom: formData.newContactNom,
            email: formData.newContactEmail,
            telephone: formData.newContactTelephone
          })
        });

        if (!contactRes.ok) throw new Error(`Impossible de créer le contact.`);
        const newContactData = await contactRes.json();
        finalContactId = newContactData.id;

      } else {
        if (!formData.contact || formData.contact === "") {
          throw new Error("Veuillez sélectionner un contact dans la liste.");
        }
        finalContactId = parseInt(formData.contact, 10);
        if (isNaN(finalContactId)) throw new Error("Identifiant invalide.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titre: formData.titre,
          statut: formData.statut,
          valeur_estimee: formData.valeur_estimee !== '' ? parseFloat(formData.valeur_estimee) : null,
          contact: finalContactId
        }),
      });

      if (!response.ok) throw new Error(`Refusé par le serveur.`);

      setSubmitSuccess(true);
      fetchData();
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(false);
        setFormData({ 
          titre: '', statut: 'NOUVEAU', valeur_estimee: '', contact: '',
          newContactNom: '', newContactEmail: '', newContactTelephone: ''
        });
        setIsNewContact(false);
      }, 1500);

    } catch (err) { setSubmitError(err.message); }
  };

  // --- LOGIQUE DE MODIFICATION ET SUPPRESSION ---
  const handleEditChange = (e) => {
    setSelectedLead({ ...selectedLead, [e.target.name]: e.target.value });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    let contactId = selectedLead.contact;
    if (typeof contactId === 'object' && contactId !== null) contactId = contactId.id;

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
          contact: parseInt(contactId, 10) 
        }),
      });

      if (!response.ok) throw new Error(`Refusé par le serveur.`);

      setShowEditModal(false);
      setSelectedLead(null);
      fetchData(); 
    } catch (err) { setEditError(err.message); }
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
          <p className="text-gray-500 text-sm mt-1">Suivi des étapes du cycle de vente (Glissez-déposez les cartes)</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          + Ajouter un Lead
        </button>
      </div>

      {/* --- MODALE D'AJOUT --- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-[500px] my-8">
            <h2 className="text-xl font-bold mb-4">Nouvelle Opportunité</h2>

            {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{submitError}</div>}
            
            {submitSuccess ? (
              <div className="py-8 text-center"><div className="text-green-600 text-xl font-bold mb-2">Succès !</div></div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'opportunité *</label>
                  <input type="text" name="titre" required value={formData.titre} onChange={handleAddChange} className="w-full border rounded px-3 py-2 focus:border-blue-500 outline-none" placeholder="Ex: Vente licences SaaS" />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4 mb-4">
                  <div className="flex space-x-4 mb-4 border-b border-gray-200 pb-3">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" name="contactMode" checked={!isNewContact} onChange={() => setIsNewContact(false)} className="mr-2 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Client existant</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" name="contactMode" checked={isNewContact} onChange={() => setIsNewContact(true)} className="mr-2 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Nouveau client</span>
                    </label>
                  </div>

                  {!isNewContact ? (
                    <div>
                      <select name="contact" required={!isNewContact} value={formData.contact} onChange={handleAddChange} className="w-full border rounded px-3 py-2 bg-white focus:border-blue-500 outline-none">
                        <option value="" disabled>-- Sélectionnez un contact --</option>
                        {contacts.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.email})</option>)}
                      </select>
                      {contacts.length === 0 && <p className="text-xs text-red-500 mt-1">Aucun contact trouvé, veuillez créer un nouveau client.</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div><input type="text" name="newContactNom" required={isNewContact} value={formData.newContactNom} onChange={handleAddChange} placeholder="Nom complet *" className="w-full border rounded px-3 py-2 focus:border-blue-500 outline-none text-sm" /></div>
                      <div><input type="email" name="newContactEmail" required={isNewContact} value={formData.newContactEmail} onChange={handleAddChange} placeholder="Adresse Email *" className="w-full border rounded px-3 py-2 focus:border-blue-500 outline-none text-sm" /></div>
                      <div><input type="text" name="newContactTelephone" value={formData.newContactTelephone} onChange={handleAddChange} placeholder="Téléphone (optionnel)" className="w-full border rounded px-3 py-2 focus:border-blue-500 outline-none text-sm" /></div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (EUR)</label>
                    <input type="number" name="valeur_estimee" value={formData.valeur_estimee} onChange={handleAddChange} className="w-full border rounded px-3 py-2 focus:border-blue-500 outline-none" placeholder="Ex: 5000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut initial</label>
                    <select name="statut" value={formData.statut} onChange={handleAddChange} className="w-full border rounded px-3 py-2 bg-white focus:border-blue-500 outline-none">
                      <option value="NOUVEAU">Nouveau</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="CONVERTI">Converti</option>
                      <option value="PERDU">Perdu</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                  <button type="submit" disabled={contacts.length === 0 && !isNewContact} className="px-4 py-2 text-white rounded shadow-sm bg-blue-600 hover:bg-blue-700">Enregistrer</button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
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

      {/* --- VUE KANBAN AVEC DRAG AND DROP --- */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Chargement du pipeline...</div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {colonnes.map((colonne) => (
            <div 
              key={colonne.id} 
              className="w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-lg p-4"
              /* --- ÉVÉNEMENTS DE DÉPÔT SUR LA COLONNE --- */
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, colonne.id)}
            >
              <div className={`border-t-4 ${colonne.couleur} pt-2 mb-4 flex justify-between items-center`}>
                <h2 className="font-bold text-gray-700">{colonne.titre}</h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                  {getLeadsByStatus(colonne.id).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                {getLeadsByStatus(colonne.id).map((lead) => (
                  <div 
                    key={lead.id} 
                    /* --- LA CARTE DEVIENT GLISSABLE --- */
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-4 rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition"
                  >
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
                  <div className="text-center text-sm text-gray-400 py-4 italic pointer-events-none">Déposez un lead ici</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}