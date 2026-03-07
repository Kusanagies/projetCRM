import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'CRM Cloud',
  description: 'CRM moderne développé avec Next.js et Django',
};

export default function RootLayout({ children }) {
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
        </aside>

        {/* Conteneur principal où les pages vont s'afficher */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>

      </body>
    </html>
  );
}