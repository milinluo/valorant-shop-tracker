import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import RecordsPage from '@/pages/Records/RecordsPage';
import SkinsPage from '@/pages/Skins/SkinsPage';
import StatsPage from '@/pages/Stats/StatsPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RecordsPage />} />
        <Route path="skins" element={<SkinsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
