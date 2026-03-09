'use client'; // Ajoutez ceci tout en haut du fichier layout.js si ce n'est pas déjà fait

import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // [Nouveau]

export default function RootLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    // 1. On supprime les tokens JWT
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // 2. On redirige vers la page de login
    router.push('/login');
  };

  return (
    <html lang="fr">
      <body className="bg-gray-50 flex h-screen overflow-hidden">
        
        {/* Menu Latéral Fixe (Sidebar) */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
          <div className="p-6 text-2xl font-bold border-b border-slate-800">
            CRM Cloud
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="block py-2.5 px-4 hover:bg-slate-800 rounded text-sm text-gray-300 hover:text-white transition-colors">
              Tableau de bord
            </Link>
            <Link href="/contacts" className="block py-2.5 px-4 hover:bg-slate-800 rounded text-sm text-gray-300 hover:text-white transition-colors">
              Contacts
            </Link>
            <Link href="/entreprises" className="block py-2.5 px-4 hover:bg-slate-800 rounded text-sm text-gray-300 hover:text-white transition-colors">
              Entreprises
            </Link>
            <Link href="/leads" className="block py-2.5 px-4 hover:bg-slate-800 rounded text-sm text-gray-300 hover:text-white transition-colors">
              Pipeline & Leads
            </Link>
          </nav>
          
          {/* Bouton de Déconnexion en bas */}
          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full text-left text-red-400 hover:text-red-300 hover:bg-slate-800 py-2.5 px-4 rounded text-sm transition-colors"
            >
              [Deconnexion]
            </button>
          </div>
        </aside>

        {/* Conteneur principal */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>

      </body>
    </html>
  );
}