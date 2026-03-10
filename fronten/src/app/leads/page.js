'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [commercials, setCommercials] = useState([]); // NOUVEAU : Liste des commerciaux
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // États pour le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);
  const [isNewContact, setIsNewContact] = useState(false); 
  const [formData, setFormData] = useState({ 
    titre: '', statut: 'NOUVEAU', valeur_estimee: '', contact: '', commercial_assigne: '',
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
      // 1. Charger les leads
      const leadsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!leadsRes.ok) throw new Error("Session expirée");
      const leadsData = await leadsRes.json();
      setLeads(Array.isArray(leadsData) ? leadsData : (leadsData.results || []));

      // 2. Charger les contacts
      const contactsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(Array.isArray(contactsData) ? contactsData : (contactsData.results || []));
      }

      // 3. Charger les commerciaux
      const commRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/commercials/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (commRes.ok) {
        setCommercials(await commRes.json());
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Erreur API:", err);
      setLoading(false);
      router.push('/login');
    }
  };

  useEffect(() => { fetchData(); }, [router]);

  // Utilitaire pour afficher le nom du commercial sur la carte
  const getCommercialName = (id) => {
    if (!id) return 'Non assigné';
    const comm = commercials.find(c => c.id === id);
    return comm ? comm.username : 'Inconnu';
  };

  // --- LOGIQUE DE DRAG AND DROP ---
  const handleDragStart = (e, leadId) => e.dataTransfer.setData('leadId', leadId.toString());
  const handleDragOver = (e) => e.preventDefault(); 
  const handleDrop = async (e, nouveauStatut) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData('leadId'), 10);
    const leadDeplace = leads.find(l => l.id === leadId);
    if (!leadDeplace || leadDeplace.statut === nouveauStatut) return;

    setLeads(leads.map(l => l.id === leadId ? { ...l, statut: nouveauStatut } : l));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          titre: leadDeplace.titre,
          statut: nouveauStatut,
          valeur_estimee: leadDeplace.valeur_estimee,
          contact: leadDeplace.contact?.id || leadDeplace.contact,
          commercial_assigne: leadDeplace.commercial_assigne
        }),
      });
    } catch (err) {
      console.error(err);
      fetchData(); 
    }
  };

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
        if (!formData.newContactNom || !formData.newContactEmail) throw new Error("Nom et email obligatoires.");
        const contactRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ nom: formData.newContactNom, email: formData.newContactEmail, telephone: formData.newContactTelephone })
        });
        if (!contactRes.ok) throw new Error("Erreur création contact");
        finalContactId = (await contactRes.json()).id;
      } else {
        if (!formData.contact) throw new Error("Sélectionnez un contact.");
        finalContactId = parseInt(formData.contact, 10);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          titre: formData.titre,
          statut: formData.statut,
          valeur_estimee: formData.valeur_estimee ? parseFloat(formData.valeur_estimee) : null,
          contact: finalContactId,
          commercial_assigne: formData.commercial_assigne ? parseInt(formData.commercial_assigne, 10) : null
        }),
      });

      if (!response.ok) throw new Error("Erreur serveur lors de la création.");

      setSubmitSuccess(true);
      fetchData();
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(false);
        setFormData({ titre: '', statut: 'NOUVEAU', valeur_estimee: '', contact: '', commercial_assigne: '', newContactNom: '', newContactEmail: '', newContactTelephone: ''});
        setIsNewContact(false);
      }, 1500);
    } catch (err) { setSubmitError(err.message); }
  };

  // --- LOGIQUE DE MODIFICATION ---
  const handleEditChange = (e) => setSelectedLead({ ...selectedLead, [e.target.name]: e.target.value });

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${selectedLead.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({
          titre: selectedLead.titre,
          statut: selectedLead.statut,
          valeur_estimee: selectedLead.valeur_estimee ? parseFloat(selectedLead.valeur_estimee) : null,
          contact: selectedLead.contact?.id || selectedLead.contact,
          commercial_assigne: selectedLead.commercial_assigne ? parseInt(selectedLead.commercial_assigne, 10) : null
        }),
      });
      if (!response.ok) throw new Error("Erreur de mise à jour");
      setShowEditModal(false);
      setSelectedLead(null);
      fetchData(); 
    } catch (err) { setEditError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }});
      setShowEditModal(false);
      setSelectedLead(null);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const getLeadsByStatus = (status) => leads.filter(lead => lead.statut === status);
  const colonnes = [
    { id: 'NOUVEAU', titre: 'Nouveaux', couleur: 'border-blue-500' },
    { id: 'EN_COURS', titre: 'En cours', couleur: 'border-yellow-500' },
    { id: 'CONVERTI', titre: 'Convertis', couleur: 'border-green-500' },
    { id: 'PERDU', titre: 'Perdus', couleur: 'border-red-500' }
  ];

  return (
    <main className="p-8 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pipeline de Vente</h1>
          <p className="text-gray-500 text-sm mt-1">Glissez-déposez les cartes</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
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
              <div className="py-8 text-center text-green-600 font-bold">Succès !</div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input type="text" name="titre" required value={formData.titre} onChange={handleAddChange} className="w-full border rounded px-3 py-2" />
                </div>
                
                {/* Sélecteur de contact */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex space-x-4 mb-4 border-b pb-3">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" checked={!isNewContact} onChange={() => setIsNewContact(false)} className="mr-2" /> Client existant
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" checked={isNewContact} onChange={() => setIsNewContact(true)} className="mr-2" /> Nouveau client
                    </label>
                  </div>
                  {!isNewContact ? (
                    <select name="contact" required={!isNewContact} value={formData.contact} onChange={handleAddChange} className="w-full border rounded px-3 py-2 bg-white">
                      <option value="" disabled>-- Sélectionnez un contact --</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  ) : (
                    <div className="space-y-3">
                      <input type="text" name="newContactNom" required={isNewContact} value={formData.newContactNom} onChange={handleAddChange} placeholder="Nom *" className="w-full border rounded px-3 py-2 text-sm" />
                      <input type="email" name="newContactEmail" required={isNewContact} value={formData.newContactEmail} onChange={handleAddChange} placeholder="Email *" className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée</label>
                    <input type="number" name="valeur_estimee" value={formData.valeur_estimee} onChange={handleAddChange} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select name="statut" value={formData.statut} onChange={handleAddChange} className="w-full border rounded px-3 py-2 bg-white">
                      <option value="NOUVEAU">Nouveau</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="CONVERTI">Converti</option>
                      <option value="PERDU">Perdu</option>
                    </select>
                  </div>
                </div>

                {/* SÉLECTEUR DE COMMERCIAL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attribuer à un commercial</label>
                  <select name="commercial_assigne" value={formData.commercial_assigne} onChange={handleAddChange} className="w-full border rounded px-3 py-2 bg-white">
                    <option value="">-- Non assigné --</option>
                    {commercials.map(c => <option key={c.id} value={c.id}>{c.username} ({c.role})</option>)}
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded">Enregistrer</button>
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
            {editError && <div className="text-red-600 mb-4">{editError}</div>}
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <input type="text" name="titre" required value={selectedLead.titre} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              <input type="number" name="valeur_estimee" value={selectedLead.valeur_estimee || ''} onChange={handleEditChange} className="w-full border rounded px-3 py-2" />
              <select name="statut" value={selectedLead.statut} onChange={handleEditChange} className="w-full border rounded px-3 py-2 bg-white">
                <option value="NOUVEAU">Nouveau</option>
                <option value="EN_COURS">En cours</option>
                <option value="CONVERTI">Converti</option>
                <option value="PERDU">Perdu</option>
              </select>
              
              {/* MODIFIER LE COMMERCIAL */}
              <select name="commercial_assigne" value={selectedLead.commercial_assigne || ''} onChange={handleEditChange} className="w-full border rounded px-3 py-2 bg-white">
                <option value="">-- Non assigné --</option>
                {commercials.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
              </select>

              <div className="flex justify-between pt-4 border-t mt-6">
                <button type="button" onClick={() => handleDelete(selectedLead.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded">Supprimer</button>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 rounded">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Mettre à jour</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VUE KANBAN --- */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">Chargement...</div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {colonnes.map((colonne) => (
            <div key={colonne.id} className="w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-lg p-4" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, colonne.id)}>
              <div className={`border-t-4 ${colonne.couleur} pt-2 mb-4 flex justify-between items-center`}>
                <h2 className="font-bold text-gray-700">{colonne.titre}</h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{getLeadsByStatus(colonne.id).length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                {getLeadsByStatus(colonne.id).map((lead) => (
                  <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} className="bg-white p-4 rounded shadow-sm border border-gray-200 cursor-grab">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{lead.titre}</h3>
                    
                    {/* AFFICHAGE DU COMMERCIAL */}
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2 font-medium">
                      👤 {getCommercialName(lead.commercial_assigne)}
                    </div>

                    <p className="text-green-600 font-bold text-sm mb-2">{lead.valeur_estimee ? `${lead.valeur_estimee} €` : '-'}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span>[Ref: #{lead.id}]</span>
                      <button onClick={() => { setSelectedLead(lead); setShowEditModal(true); }} className="text-blue-500 hover:underline">[Modifier]</button>
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