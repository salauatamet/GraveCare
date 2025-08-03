import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ relativeClaims, setRelativeClaims, graves, setGraves }) => {
  const [activeTab, setActiveTab] = useState('claims');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGrave, setCurrentGrave] = useState({
    id: null,
    name: '',
    city: '',
    address: '',
    coordinates: '',
    photo: '',
    telegramLink: '',
    twoGISLink: '',
    rating: '',
  });
  const [photoFile, setPhotoFile] = useState(null);

  const fetchGraves = async () => {
    try {
      const response = await axios.get('http://localhost:8080/graves');
      setGraves(response.data);
    } catch (error) {
      console.error('Error fetching graves:', error);
    }
  };

  const updateClaimStatus = async (claimId, newStatus) => {
    try {
      setLoading(true);
      await axios.put(`http://localhost:8080/relative-claims/${claimId}/status`, { status: newStatus });
      const response = await axios.get('http://localhost:8080/relative-claims');
      setRelativeClaims(response.data);
    } catch (error) {
      console.error('Error updating claim status:', error);
      alert('Ошибка при обновлении статуса.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (claimId, fileName) => {
    try {
      const response = await axios.get(`http://localhost:8080/relative-claims/${claimId}/file`, {
        responseType: 'blob',
      });
      const extension = fileName.split('.').pop().toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
        alert('Недопустимый формат файла. Допустимы только PDF, JPG, JPEG, PNG.');
        return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Ошибка при скачивании файла.');
    }
  };

  const openModal = (grave = null) => {
    if (grave) {
      setCurrentGrave(grave);
      setIsEditMode(true);
    } else {
      setCurrentGrave({
        id: null,
        name: '',
        city: '',
        address: '',
        coordinates: '',
        photo: '',
        telegramLink: '',
        twoGISLink: '',
        rating: '',
      });
      setIsEditMode(false);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const saveGrave = async () => {
    if (!currentGrave.city || !currentGrave.address || !currentGrave.coordinates) {
      alert('Пожалуйста, заполните все обязательные поля: Город, Адрес, Координаты.');
      return;
    }
  
    // Валидация формата координат
    const coords = currentGrave.coordinates.split(',').map(Number);
    const [lat, lon] = coords;
    if (coords.length !== 2 || isNaN(lat) || isNaN(lon)) {
      alert('Координаты должны быть в формате "широта,долгота", например: "55.7558,37.6173".');
      return;
    }
  
    try {
      setLoading(true);
      let graveId = currentGrave.id;
  
      if (isEditMode) {
        await axios.put(`http://localhost:8080/graves/${graveId}`, currentGrave);
      } else {
        const response = await axios.post('http://localhost:8080/graves', currentGrave);
        graveId = response.data.id;
      }
  
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        const photoResponse = await axios.post(`http://localhost:8080/graves/${graveId}/upload-photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setCurrentGrave({ ...currentGrave, photo: photoResponse.data.photoPath });
      }
  
      setIsModalOpen(false);
      await fetchGraves();
    } catch (error) {
      console.error('Error saving grave:', error);
      alert(`Ошибка при сохранении могилы: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteGrave = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту могилу?')) return;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8080/graves/${id}`);
      await fetchGraves();
    } catch (error) {
      console.error('Error deleting grave:', error);
      alert('Ошибка при удалении могилы.');
    } finally {
      setLoading(false);
    }
  };

  // Функция для отображения звёзд по рейтингу
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (halfStar) {
      stars.push(<span key="half" className="text-yellow-400">½</span>);
    }
    while (stars.length < 5) {
      stars.push(<span key={stars.length} className="text-gray-300">★</span>);
    }
    return stars;
  };

  useEffect(() => {
    fetchGraves();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Административная панель</h2>

      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'claims' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
          onClick={() => setActiveTab('claims')}
        >
          Заявки
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'graves' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
          onClick={() => setActiveTab('graves')}
        >
          Могилы
        </button>
      </div>

      {activeTab === 'claims' && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Управление заявками</h3>
          {relativeClaims && relativeClaims.length > 0 ? (
            <div className="space-y-4">
              {relativeClaims.map((claim) => {
                const grave = graves.find((g) => g.id === claim.graveId) || {};
                const fileName = claim.fileName || `unknown_${claim.id}.txt`;

                return (
                  <div key={claim.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md">
                    <p className="text-gray-600 dark:text-gray-300"><strong>ID заявки:</strong> {claim.id}</p>
                    <p className="text-gray-600 dark:text-gray-300"><strong>ID могилы:</strong> {claim.graveId}</p>
                    <p className="text-gray-600 dark:text-gray-300"><strong>Название могилы:</strong> {grave.name || 'Не указано'}</p>
                    <p className="text-gray-600 dark:text-gray-300"><strong>Имя:</strong> {claim.name}</p>
                    <p className="text-gray-600 dark:text-gray-300"><strong>Родственная связь:</strong> {claim.relation}</p>
                    <p className="text-gray-600 dark:text-gray-300"><strong>Статус:</strong> {claim.status}</p>
                    <button
                      onClick={() => downloadFile(claim.id, fileName)}
                      className="mt-2 text-blue-500 hover:underline"
                    >
                      Скачать файл ({fileName})
                    </button>
                    {claim.status === 'На рассмотрении' && (
                      <div className="mt-2 space-x-2">
                        <button
                          onClick={() => updateClaimStatus(claim.id, 'Подтверждено')}
                          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                          disabled={loading}
                        >
                          Подтвердить
                        </button>
                        <button
                          onClick={() => updateClaimStatus(claim.id, 'Отклонено')}
                          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                          disabled={loading}
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">Заявки отсутствуют.</p>
          )}
        </div>
      )}

      {activeTab === 'graves' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Управление могилами</h3>
            <button
              onClick={() => openModal()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Добавить могилу
            </button>
          </div>
          {graves && graves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {graves.map((grave) => (
                <div key={grave.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md">
                  <p className="text-gray-600 dark:text-gray-300"><strong>ID:</strong> {grave.id}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Название могилы:</strong> {grave.name || 'Не указано'}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Город:</strong> {grave.city}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Адрес:</strong> {grave.address}</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Координаты:</strong> {grave.coordinates}</p>
                  {grave.photo && (
                    <div className="mt-2">
                      <p className="text-gray-600 dark:text-gray-300"><strong>Фото:</strong></p>
                      <img src={`http://localhost:8080${grave.photo}`} alt="Grave Photo" className="w-full h-48 object-cover rounded" />
                    </div>
                  )}
                  {grave.telegramLink && (
                    <div className="mt-2">
                      <p className="text-gray-600 dark:text-gray-300"><strong>Telegram:</strong> <a href={grave.telegramLink} target="_blank" className="text-blue-500 hover:underline">{grave.telegramLink}</a></p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(grave.telegramLink)}`}
                        alt="QR Code"
                        className="mt-2"
                      />
                    </div>
                  )}
                  {grave.twoGISLink && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2"><strong>2GIS:</strong> <a href={grave.twoGISLink} target="_blank" className="text-blue-500 hover:underline">{grave.twoGISLink}</a></p>
                  )}
                  {grave.rating && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      <strong>Рейтинг:</strong> {renderStars(grave.rating)}{' '}
                      <span className="text-xs text-gray-500 dark:text-gray-400">(рейтинг из 2GIS)</span>
                    </p>
                  )}
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => openModal(grave)}
                      className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteGrave(grave.id)}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">Могилы отсутствуют.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {isEditMode ? 'Редактировать могилу' : 'Добавить могилу'}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название могилы"
                value={currentGrave.name}
                onChange={(e) => setCurrentGrave({ ...currentGrave, name: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Город"
                value={currentGrave.city}
                onChange={(e) => setCurrentGrave({ ...currentGrave, city: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Адрес"
                value={currentGrave.address}
                onChange={(e) => setCurrentGrave({ ...currentGrave, address: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Координаты (широта,долгота)"
                value={currentGrave.coordinates}
                onChange={(e) => setCurrentGrave({ ...currentGrave, coordinates: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <div>
                <label className="text-gray-600 dark:text-gray-300">Фото могилы (JPG, JPEG, PNG):</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
                />
                {currentGrave.photo && (
                  <div className="mt-2">
                    <p className="text-gray-600 dark:text-gray-300">Текущее фото:</p>
                    <img src={`http://localhost:8080${currentGrave.photo}`} alt="Current Photo" className="w-full h-48 object-cover rounded" />
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Ссылка на Telegram-группу (опционально)"
                value={currentGrave.telegramLink}
                onChange={(e) => setCurrentGrave({ ...currentGrave, telegramLink: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Ссылка на 2GIS (опционально)"
                value={currentGrave.twoGISLink}
                onChange={(e) => setCurrentGrave({ ...currentGrave, twoGISLink: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Рейтинг (0.0 - 5.0)"
                value={currentGrave.rating}
                onChange={(e) => setCurrentGrave({ ...currentGrave, rating: parseFloat(e.target.value) || '' })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Отмена
                </button>
                <button
                  onClick={saveGrave}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {isEditMode ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;