'use client';

import { useEffect, useState } from 'react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la création
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ nom: '', email: '', telephone: '' });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // États pour la modification / suppression
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editError, setEditError] = useState(null);

  const fetchContacts = () => {
    fetch('http://127.0.0.1:8000/api/contacts/')
      .then(res => res.json())
      .then(data => {
        setContacts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur API:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // --- LOGIQUE DE CRÉATION ---
  const handleAddChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/contacts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        // Gère l'erreur très courante de l'email en doublon
        if (errData.email) throw new Error("Cet email est déjà utilisé par un autre contact.");
        throw new Error("Erreur de saisie. Vérifiez vos champs.");
      }

      setSubmitSuccess(true);
      fetchContacts();
      
      // Ferme la fenêtre après 1.5s
      setTimeout(() => {
        setShowAddForm(false);
        setSubmitSuccess(false);
        setFormData({ nom: '', email: '', telephone: '' });
      }, 1500);
      
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  // --- LOGIQUE DE MODIFICATION ---
  const handleEditChange = (e) => {
    setSelectedContact({ ...selectedContact, [e.target.name]: e.target.value });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    try {
      // On n'envoie que les champs autorisés à être modifiés
      const updateData = {
        nom: selectedContact.nom,
        email: selectedContact.email,
        telephone: selectedContact.telephone
      };

      const response = await fetch(`http://127.0.0.1:8000/api/contacts/${selectedContact.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (errData.email) throw new Error("Cet email est déjà utilisé.");
        throw new Error("Impossible de modifier le contact.");
      }

      // Succès : on ferme la modale et on recharge
      setShowEditModal(false);
      setSelectedContact(null);
      fetchContacts();
      
    } catch (err) {
      setEditError(err.message);
    }
  };

  // --- LOGIQUE DE SUPPRESSION ---
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce contact ? Action irréversible.")) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/contacts/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Impossible de supprimer ce contact côté serveur.");

      // Succès : on ferme la modale et on recharge
      setShowEditModal(false);
      setSelectedContact(null);
      fetchContacts();
      
    } catch (err) {
      alert("Erreur de suppression : " + err.message);
    }
  };

  return (
    <main className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Contacts</h1>
        <button 
          onClick={() => {
            setShowAddForm(true);
            setSubmitError(null);
            setSubmitSuccess(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Nouveau Contact
        </button>
      </div>

      {/* --- MODALE D'AJOUT --- */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-96">
            <h2 className="text-xl font-bold mb-4">Ajouter un contact</h2>
            
            {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">{submitError}</div>}
            
            {submitSuccess ? (
              <div className="py-8 text-center">
                <div className="text-green-600 text-xl font-bold mb-2">Succès !</div>
                <p className="text-gray-600">Contact ajouté.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input type="text" name="nom" required value={formData.nom} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="text" name="telephone" value={formData.telephone} onChange={handleAddChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
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

      {/* --- MODALE DE DÉTAILS / MODIFICATION / SUPPRESSION --- */}
      {showEditModal && selectedContact && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-96">
            <h2 className="text-xl font-bold mb-4">Détails du contact</h2>
            
            {editError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">{editError}</div>}
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input type="text" name="nom" required value={selectedContact.nom} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" required value={selectedContact.email} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="text" name="telephone" value={selectedContact.telephone || ''} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              
              <div className="flex justify-between pt-4 border-t mt-6">
                <button 
                  type="button" 
                  onClick={() => handleDelete(selectedContact.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition font-medium"
                >
                  Supprimer
                </button>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm">Mettre à jour</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TABLEAU DES CONTACTS --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement des contacts...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">Nom</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Date d'ajout</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{contact.nom}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>[Email] {contact.email}</div>
                    {contact.telephone && <div>[Tel] {contact.telephone}</div>}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(contact.date_ajout).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4 text-sm">
                    <button 
                      onClick={() => {
                        setSelectedContact(contact);
                        setEditError(null);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Voir / Modifier
                    </button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">Aucun contact trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}