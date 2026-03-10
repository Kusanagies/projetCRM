'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'STANDARD' });
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        const errorMessage = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        throw new Error(errorMessage || "Erreur lors de l'inscription");
      }

      // Si succès, on redirige vers le login
      alert("Compte créé avec succès ! Connectez-vous.");
      router.push('/login');
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 absolute inset-0 z-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
          <p className="text-gray-500 mt-2">Rejoignez votre CRM Cloud</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
            <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full px-4 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Choisissez votre rôle</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded bg-white focus:ring-blue-500 focus:border-blue-500">
              <option value="STANDARD">Utilisateur Standard</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded mt-4 hover:bg-green-700 transition font-medium">
            S'inscrire
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-semibold">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}