const GraveCard = ({ grave, onView }) => {
  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{grave.fio}</h3>
      <p className="text-gray-600 dark:text-gray-300">Город: {grave.city}</p>
      <p className="text-gray-600 dark:text-gray-300">Адрес: {grave.address}</p>
      <button
        onClick={() => onView(grave.id)}
        className="mt-2 text-blue-500 hover:underline"
      >
        Подробнее
      </button>
    </div>
  );
};

export default GraveCard;