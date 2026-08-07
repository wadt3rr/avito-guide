import { Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { CatalogPage } from './pages/CatalogPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { MyListingsPage } from './pages/MyListingsPage';

/** В личном кабинете вторая строка шапки другая — без поиска. */
const PROFILE_PATHS = ['/my', '/orders'];

export function App() {
  const { pathname } = useLocation();
  const variant = PROFILE_PATHS.includes(pathname) ? 'profile' : 'main';

  return (
    <>
      <Header variant={variant} />
      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/create" element={<CreateListingPage />} />
          <Route path="/my" element={<MyListingsPage />} />
          <Route path="/orders" element={<DeliveryPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
