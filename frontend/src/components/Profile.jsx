import { useState } from 'react';

const Profile = ({ user, searchHistory, relativeClaims, graves }) => {
  const [visibleItems, setVisibleItems] = useState(5); // Показывать первые 5 элементов по умолчанию

  if (!user) {
    return <p className="text-gray-600 dark:text-gray-300 p-4">Пожалуйста, войдите для просмотра профиля.</p>;
  }

  // Функция для плавной загрузки дополнительных элементов
  const loadMore = () => {
    setVisibleItems((prev) => prev + 5); // Увеличиваем на 5 элементов с анимацией
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Личный кабинет</h2>
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Данные пользователя</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>Имя:</strong> {user.displayName}</p>
        <p className="text-gray-600 dark:text-gray-300 mb-4"><strong>Email:</strong> {user.email}</p>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Статус подтверждения родства</h3>
        {relativeClaims.length > 0 ? (
          relativeClaims.map((claim) => {
            // Находим соответствующую могилу по graveId
            const grave = graves.find((g) => g.id === claim.graveId) || {};
            const graveFio = grave.fio || 'Неизвестно';
            return (
              <div key={claim.id} className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300"><strong>Захороненный:</strong> {graveFio}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Имя родственника:</strong> {claim.name}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Родственная связь:</strong> {claim.relation}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Статус:</strong> {claim.status}</p>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600 dark:text-gray-300">Заявки на подтверждение отсутствуют.</p>
        )}

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4 mb-2">История поиска</h3>
        {searchHistory.length > 0 ? (
          <ul className="list-disc pl-5 mb-4 transition-opacity duration-300 ease-in-out">
            {searchHistory.slice(0, visibleItems).map((search, index) => (
              <li key={index} className="text-gray-600 dark:text-gray-300">
                ФИО: {search.fio}, Город: {search.city} (Дата: {search.date})
              </li>
            ))}
            {visibleItems < searchHistory.length && (
              <button
                onClick={loadMore}
                className="mt-2 text-blue-500 hover:underline transition-colors duration-200 ease-in-out"
              >
                Ещё
              </button>
            )}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 mb-4">История поиска пуста.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;