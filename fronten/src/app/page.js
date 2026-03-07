import Link from 'next/link';

export default function Dashboard() {
  return (
    <main className="p-8 w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord intelligent</h1>
        <p className="text-gray-500 mt-1">Aperçu de vos performances commerciales</p>
      </header>

      {/* Cartes des KPI (Indicateurs de performance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI : Chiffre d'Affaires */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">CA du mois</h3>
          <p className="text-3xl font-bold text-gray-800">12 450 EUR</p>
          <p className="text-green-500 text-sm mt-2 font-medium">+15% vs mois précédent</p>
        </div>

        {/* KPI : Nouveaux Prospects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Nouveaux prospects</h3>
          <p className="text-3xl font-bold text-gray-800">24</p>
          <p className="text-blue-500 text-sm mt-2 font-medium">Objectif atteint: 80%</p>
        </div>

        {/* KPI : Rendez-vous */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">RDV du jour</h3>
          <p className="text-3xl font-bold text-gray-800">3</p>
          <p className="text-gray-400 text-sm mt-2">A venir: Présentation SaaS</p>
        </div>

        {/* KPI : Tâches Urgentes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Tâches urgentes</h3>
          <p className="text-3xl font-bold text-red-600">5</p>
          <p className="text-red-400 text-sm mt-2 font-medium">Relances à effectuer</p>
        </div>
      </div>

      {/* Section Dynamique */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Activité récente</h2>
        <div className="text-gray-500 text-sm bg-gray-50 p-8 rounded border border-dashed border-gray-200 text-center">
          Le tableau des dernières activités s'affichera ici.
        </div>
      </div>
    </main>
  );
}