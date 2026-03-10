'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // On ne veut pas afficher le menu sur les pages de connexion et d'inscription
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50 text-gray-900 h-screen flex overflow-hidden`}>
        
        {/* --- BARRE LATÉRALE (SIDEBAR) --- */}
        {!isAuthPage && (
          <aside className="w-64 bg-gray-900 text-white flex flex-col h-full shadow-xl z-10 flex-shrink-0">
            {/* Logo du CRM */}
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-black text-white tracking-tight">
                CRM<span className="text-blue-500">Cloud</span>
              </h2>
            </div>
            
            {/* Menu de navigation (SANS EMOJIS) */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link href="/" className={`block px-4 py-3 rounded-lg transition font-medium ${pathname === '/' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                Tableau de Bord
              </Link>
              <Link href="/contacts" className={`block px-4 py-3 rounded-lg transition font-medium ${pathname === '/contacts' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                Contacts
              </Link>
              <Link href="/entreprises" className={`block px-4 py-3 rounded-lg transition font-medium ${pathname === '/entreprises' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                Entreprises
              </Link>
              <Link href="/leads" className={`block px-4 py-3 rounded-lg transition font-medium ${pathname === '/leads' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                Pipeline Ventes
              </Link>
              <Link href="/taches" className={`block px-4 py-3 rounded-lg transition font-medium ${pathname === '/taches' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                Agenda & Tâches
              </Link>
              <Link href="/automations" className={`block px-4 py-3 rounded-lg transition font-medium ${pathname === '/automations' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                Automations
              </Link>
            </nav>

            {/* Bouton Déconnexion en bas */}
            <div className="p-4 border-t border-gray-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition font-medium"
              >
                Déconnexion
              </button>
            </div>
          </aside>
        )}

        {/* --- CONTENU DE LA PAGE --- */}
        <main className="flex-1 h-full overflow-hidden bg-gray-50">
          {children}
        </main>

      </body>
    </html>
  );
}