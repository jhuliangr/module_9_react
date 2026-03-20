import { Route, Routes } from 'react-router';
import { MainMenu } from './MainMenu';
import { NotFound } from './NotFound';
import { ComingSoon } from './ComingSoon';
import { Settings } from './MainMenu/Settings';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/">
        <Route index Component={MainMenu} />
        <Route path="/play" Component={ComingSoon} />
        <Route path="/achivements" Component={ComingSoon} />
        <Route path="/settings" Component={Settings} />
      </Route>
      <Route path="*" Component={NotFound} />
    </Routes>
  );
};
