import { useState, useEffect } from 'react';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const updateYear = () => setCurrentYear(new Date().getFullYear());
    updateYear();
    const interval = setInterval(updateYear, 1000 * 60 * 60 * 24 * 365);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-white dark:bg-gray-800 shadow-md p-4 mt-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <p className="text-sm">Все права защищены © {currentYear}</p>
        <p className="text-sm">RAIMARA</p>
      </div>
    </footer>
  );
};

export default Footer;