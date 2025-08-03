import { Link } from 'react-router-dom';

const GravesList = ({ graves }) => {
  if (!graves || graves.length === 0) {
    return <div className="container mx-auto p-4">Нет доступных могил.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Список могил</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {graves.map((grave) => (
          <div key={grave.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{grave.name}</h2>
            <p className="text-gray-600 dark:text-gray-300">Город: {grave.city}</p>
            <p className="text-gray-600 dark:text-gray-300">Адрес: {grave.address}</p>
            <Link
              to={`/graves/${grave.id}`}
              className="mt-2 inline-block text-blue-500 hover:underline"
            >
              Подробнее
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GravesList;