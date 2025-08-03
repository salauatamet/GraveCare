import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const GraveModal = ({
  burial,
  onClose,
  onClaimRelative,
  user,
  isRelativeForm,
  relativeData,
  setRelativeData,
  handleRelativeSubmit,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [graveCoordinates, setGraveCoordinates] = useState(null);

  useEffect(() => {
    const fetchGraveCoordinates = async () => {
      if (burial && burial.graveId) {
        try {
          const response = await axios.get(`http://localhost:8080/graves/${burial.graveId}`);
          const graveData = response.data;
          setGraveCoordinates(graveData.coordinates);
        } catch (error) {
          console.error('Error fetching grave coordinates:', error);
        }
      }
    };

    fetchGraveCoordinates();
  }, [burial]);

  useEffect(() => {
    if (graveCoordinates && mapRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
  
      const [lat, lon] = graveCoordinates.split(',').map(Number);
      if (isNaN(lat) || isNaN(lon)) {
        console.error('Invalid coordinates:', graveCoordinates);
        return;
      }
  
      const initMap = () => {
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
      };
  
      initMap();
    }
  
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [graveCoordinates]);

  if (!burial) return null;

  if (isRelativeForm) {
    const relations = ['Отец', 'Мать', 'Брат', 'Сестра', 'Дед', 'Бабушка', 'Другое'];
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-close" onClick={onClose}>
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
            {relations.map((relation) => (
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
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-close" onClick={onClose}>
          ×
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{burial.fio}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          <strong>Город:</strong> {burial.city}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          <strong>Адрес:</strong> {burial.address}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          <strong>Координаты:</strong> {burial.coordinates}
        </p>
        {graveCoordinates && (
          <div className="map-container-wrapper">
            <div
              ref={mapRef}
              style={{ height: '400px', width: '100%' }}
              className="mb-4 rounded"
            ></div>
          </div>
        )}
        {user && !isRelativeForm && (
          <button
            onClick={() => onClaimRelative(burial.graveId)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
          >
            Я родственник
          </button>
        )}
      </div>
    </div>
  );
};

export default GraveModal;