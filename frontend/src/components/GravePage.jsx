import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GravePage = ({ user, relativeClaims }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedGrave, setSelectedGrave] = useState(null);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showRelativeForm, setShowRelativeForm] = useState(false);
  const [relativeData, setRelativeData] = useState({ name: '', relation: '', file: null });

  useEffect(() => {
    console.log('Component mounted with ID:', id);
    console.log('User:', user);
    console.log('Relative Claims:', relativeClaims);
    if (!id || id === 'undefined') {
      console.error('Invalid ID:', id);
      setError('Некорректный ID могилы');
      navigate('/');
      return;
    }

    console.log('Fetching grave with ID:', id);
    const fetchGrave = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/graves/${id}`);
        console.log('Fetched Grave data (full):', response.data); // Полный объект
        setSelectedGrave(response.data);
      } catch (error) {
        console.error('Error fetching grave:', error);
        setError('Ошибка при загрузке данных о могиле');
      }
    };
    fetchGrave();
  }, [id, navigate]);

  useEffect(() => {
    if (selectedGrave && selectedGrave.coordinates && mapRef.current) {
      console.log('Initializing map for coordinates:', selectedGrave.coordinates);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }

      const [lat, lon] = selectedGrave.coordinates.split(',').map(Number);
      console.log('Parsed Coordinates:', lat, lon);

      if (isNaN(lat) || isNaN(lon)) {
        console.error('Invalid coordinates:', selectedGrave.coordinates);
        return;
      }

      const initMap = () => {
        setTimeout(() => {
          if (window.ymaps) {
            window.ymaps.ready(() => {
              try {
                const map = new window.ymaps.Map(mapRef.current, {
                  center: [lat, lon],
                  zoom: 12,
                });

                const placemark = new window.ymaps.Placemark([lat, lon], {
                  hintContent: 'Место захоронения',
                  balloonContent: 'Здесь находится могила',
                });

                map.geoObjects.add(placemark);
                mapInstanceRef.current = map;
                console.log('Yandex Map initialized:', map);
              } catch (error) {
                console.error('Error initializing Yandex Map:', error);
              }
            });
          } else {
            console.error('Yandex Maps API not loaded');
          }
        }, 100);
      };

      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedGrave]);

  // Проверка подтверждённого родства
  const isUserRelatedToGrave = () => {
    if (!user || !selectedGrave || !relativeClaims) {
      console.log('isUserRelatedToGrave failed: Missing user, selectedGrave, or relativeClaims');
      return false;
    }
    const userEmail = user.email;
    const graveId = Number(id);
    console.log('Checking relation for user:', userEmail, 'and graveId:', graveId);
    console.log('Relative Claims for check:', relativeClaims);
    const isRelated = relativeClaims.some((claim) => {
      console.log('Checking claim:', claim);
      const match = claim.graveId === graveId && 
                    claim.userEmail === userEmail && 
                    (claim.status === 'approved' || claim.status === 'Подтверждено');
      console.log('Match result:', match);
      return match;
    });
    console.log('isUserRelatedToGrave result:', isRelated);
    return isRelated;
  };

  const handleClaimRelative = () => {
    setShowRelativeForm(true);
  };

  const handleRelativeSubmit = async () => {
    if (!relativeData.name || !relativeData.relation || !relativeData.file) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }
  
    if (relativeData.file.size > 5 * 1024 * 1024) {
      alert('Файл превышает 5MB!');
      return;
    }
  
    const formData = new FormData();
    formData.append('graveId', selectedGrave.id);
    formData.append('name', relativeData.name);
    formData.append('relation', relativeData.relation);
    formData.append('file', relativeData.file);
    formData.append('userEmail', user ? user.email : ''); // Безопасная проверка

    try {
      const response = await axios.post('http://localhost:8080/relative-claims', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Response from server:', response.data);
      setShowRelativeForm(false);
      alert('Запрос на подтверждение отправлен на модерацию!');
      const fetchRelativeClaims = async () => {
        try {
          const response = await axios.get('http://localhost:8080/relative-claims');
          if (response.data && Array.isArray(response.data)) {
            console.log('Updated relative claims:', response.data);
          }
        } catch (error) {
          console.error('Error fetching relative claims:', error);
        }
      };
      fetchRelativeClaims();
    } catch (error) {
      console.error('Error submitting claim:', error.response ? error.response.data : error.message);
      alert(`Ошибка при отправке заявки: ${error.response?.data?.error || error.message}. Попробуйте снова.`);
    }
  };

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!selectedGrave) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{selectedGrave.name}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-2">
        <strong>Город:</strong> {selectedGrave.city}
      </p>
      <p className="text-gray-600 dark:text-gray-300 mb-2">
        <strong>Адрес:</strong> {selectedGrave.address}
      </p>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        <strong>Координаты:</strong> {selectedGrave.coordinates}
      </p>
      <div className="map-container-wrapper">
        <div
          ref={mapRef}
          style={{ height: '400px', width: '100%' }}
          className="mb-4 rounded"
        ></div>
      </div>
      {selectedGrave.burials && selectedGrave.burials.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Захороненные:</h2>
          <ul>
            {selectedGrave.burials.map((burial) => (
              <li key={burial.id} className="text-gray-600 dark:text-gray-300 mb-1">
                {burial.fio}
              </li>
            ))}
          </ul>
        </div>
      )}
      {user && !showRelativeForm && (
        <button
          onClick={handleClaimRelative}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
        >
          Я родственник
        </button>
      )}
      {showRelativeForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-close" onClick={() => setShowRelativeForm(false)}>
              ×
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Подтверждение родства</h2>
            <input
              type="text"
              placeholder="Ваше имя"
              value={relativeData.name}
              onChange={(e) => setRelativeData({ ...relativeData, name: e.target.value })}
              className="border p-2 mb-2 w-full rounded text-gray-800 dark:text-gray-200 dark:bg-gray-800"
            />
            <select
              value={relativeData.relation}
              onChange={(e) => setRelativeData({ ...relativeData, relation: e.target.value })}
              className="border p-2 mb-2 w-full rounded text-gray-800 dark:text-gray-200 dark:bg-gray-800"
            >
              <option value="">Выберите родственную связь</option>
              {['Отец', 'Мать', 'Брат', 'Сестра', 'Дед', 'Бабушка', 'Другое'].map((relation) => (
                <option key={relation} value={relation}>
                  {relation}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="application/pdf, image/*"
              onChange={(e) => setRelativeData({ ...relativeData, file: e.target.files[0] })}
              className="border p-2 mb-2 w-full rounded text-gray-800 dark:text-gray-200 dark:bg-gray-800"
            />
            <button
              onClick={handleRelativeSubmit}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Отправить
            </button>
          </div>
        </div>
      )}
      {selectedGrave.telegramLink && isUserRelatedToGrave() && (
        <div className="mt-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Telegram группа</h3>
          <a
            href={selectedGrave.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline block mb-2"
          >
            Перейти по ссылке
          </a>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedGrave.telegramLink)}`}
            alt="QR Code"
            style={{ width: '150px', height: '150px' }}
          />
        </div>
      )}
      {selectedGrave.photo && (
        <div className="mt-4">
          <img
            src={`http://localhost:8080${selectedGrave.photo}`}
            alt="Grave"
            className="w-full h-auto rounded"
          />
        </div>
      )}
      {selectedGrave.twoGISLink && (
        <div className="mt-2">
          <a
            href={selectedGrave.twoGISLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Ссылка на 2GIS
          </a>
        </div>
      )}
    </div>
  );
};

export default GravePage;