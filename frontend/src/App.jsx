import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Добавлен Link
import Header from './components/Header';
import GraveModal from './components/GraveModal';
import GravePage from './components/GravePage';
import GravesList from './components/GravesList';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import Footer from './components/Footer';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAgXFhOIlhngZBHKaC3z_y-2D2hCD4U988",
  authDomain: "gravecare-45e98.firebaseapp.com",
  projectId: "gravecare-45e98",
  storageBucket: "gravecare-45e98.firebasestorage.app",
  messagingSenderId: "220249699902",
  appId: "1:220249699902:web:a59d4e317828ab3abe036f",
  measurementId: "G-LJGNSWHV70"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const AppContent = () => {
  const [fio, setFio] = useState('');
  const [city, setCity] = useState('');
  const [burials, setBurials] = useState([]);
  const [selectedBurial, setSelectedBurial] = useState(null);
  const [showRelativeForm, setShowRelativeForm] = useState(false);
  const [relativeData, setRelativeData] = useState({ name: '', relation: '', file: null });
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [relativeClaims, setRelativeClaims] = useState([]);
  const [allGraves, setAllGraves] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      console.log('Auth state changed, user:', user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchAllGraves = async () => {
      try {
        const response = await axios.get('http://localhost:8080/graves');
        if (response.data && Array.isArray(response.data)) {
          setAllGraves(response.data);
        } else {
          console.error('Unexpected response format for all graves:', response.data);
          setAllGraves([]);
        }
      } catch (error) {
        console.error('Error fetching all graves:', error);
        setAllGraves([]);
      }
    };
    fetchAllGraves();
  }, []);

  useEffect(() => {
    const fetchRelativeClaims = async () => {
      try {
        const response = await axios.get('http://localhost:8080/relative-claims');
        if (response.data && Array.isArray(response.data)) {
          setRelativeClaims(response.data);
        } else {
          console.error('Unexpected response format for relative claims:', response.data);
          setRelativeClaims([]);
        }
      } catch (error) {
        console.error('Error fetching relative claims:', error);
        setRelativeClaims([]);
      }
    };
    fetchRelativeClaims();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const searchBurials = async () => {
    try {
      const response = await axios.get('http://localhost:8080/burials', {
        params: { fio, city },
      });
      console.log('Search response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setBurials(response.data);
        setHasSearched(true);
        if (response.data.length > 0) {
          const newSearch = { fio, city, date: new Date().toLocaleString() };
          setSearchHistory([...searchHistory, newSearch]);
        }
      } else {
        console.error('Unexpected response format:', response.data);
        setBurials([]);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error fetching burials:', error);
      setBurials([]);
      setHasSearched(true);
    }
  };

  const viewBurial = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8080/burials/${id}`);
      const burialData = response.data;
      if (burialData && burialData.id) {
        setSelectedBurial(burialData);
      } else {
        console.error('Burial data is invalid:', burialData);
        setSelectedBurial(null);
      }
    } catch (error) {
      console.error('Error fetching burial:', error);
      setSelectedBurial(null);
    }
  };

  const handleClaimRelative = (graveId) => {
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
    formData.append('graveId', selectedBurial.graveId);
    formData.append('name', relativeData.name);
    formData.append('relation', relativeData.relation);
    formData.append('file', relativeData.file);
  
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
            setRelativeClaims(response.data);
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

  const handleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        setUser(result.user);
      })
      .catch((error) => {
        console.error('Error logging in:', error);
      });
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setUser(null);
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex-1">
              <div className="flex flex-col items-center p-4">
                <div className="w-full max-w-md mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                    Поиск захоронения
                  </h2>
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                    <input
                      type="text"
                      placeholder="ФИО"
                      value={fio}
                      onChange={(e) => setFio(e.target.value)}
                      className="border p-2 rounded w-full mb-4 text-gray-800 dark:text-gray-200 dark:bg-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="Город/Область"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="border p-2 rounded w-full mb-4 text-gray-800 dark:text-gray-200 dark:bg-gray-800"
                    />
                    <button
                      onClick={searchBurials}
                      className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600"
                    >
                      Поиск
                    </button>
                  </div>
                </div>
                {hasSearched ? (
                  burials.length > 0 ? (
                    <div className="w-full max-w-3xl">
                      {burials.map((burial) => (
                        <div
                          key={burial.id}
                          className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-4"
                        >
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            {burial.fio}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">Город: {burial.city}</p>
                          <button
                            onClick={() => viewBurial(burial.id)}
                            className="mt-2 text-blue-500 hover:underline"
                          >
                            Подробнее
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">Результаты поиска отсутствуют.</p>
                  )
                ) : null}
                {selectedBurial && (
                  <GraveModal
                    burial={selectedBurial}
                    onClose={() => setSelectedBurial(null)}
                    user={user}
                    onClaimRelative={handleClaimRelative}
                    isRelativeForm={showRelativeForm}
                    relativeData={relativeData}
                    setRelativeData={setRelativeData}
                    handleRelativeSubmit={handleRelativeSubmit}
                  />
                )}
              </div>
            </div>
          }
        />
        <Route
          path="/graves"
          element={<GravesList graves={allGraves} />}
        />
        <Route
          path="/graves/:id"
          element={<GravePage user={user} relativeClaims={relativeClaims} />}
        />
        <Route
          path="/profile"
          element={<Profile user={user} searchHistory={searchHistory} relativeClaims={relativeClaims} graves={allGraves} />}
        />
        <Route
          path="/admin"
          element={<AdminPanel relativeClaims={relativeClaims} setRelativeClaims={setRelativeClaims} graves={allGraves} setGraves={setAllGraves} />}
        />
      </Routes>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;