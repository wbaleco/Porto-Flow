import { View, User } from '../types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import FleetManagement from './pages/FleetManagement';
import DriverMobile from './pages/DriverMobile';
import DashboardWrapper from './components/ui/DashboardWrapper';
import { AnimatePresence } from 'motion/react';
import { useState } from 'react';
import TerminalApprovals from './pages/TerminalApprovals';
import Scheduling from './pages/Scheduling';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    if (userData.role === 'motorista') {
      setCurrentView('driver');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  return (
    <AnimatePresence mode="wait">
      {currentView === 'login' ? (
        <Login key="login" onLogin={handleLogin} />
      ) : currentView === 'driver' ? (
        <DriverMobile key="driver" onBack={() => setCurrentView('dashboard')} />
      ) : (
        <DashboardWrapper 
          key="app" 
          activeTab={currentView} 
          onTabChange={setCurrentView}
          onLogout={handleLogout}
          user={user}
        >
          {currentView === 'dashboard' ? <Dashboard /> :
           currentView === 'fleet' ? <FleetManagement /> :
           currentView === 'scheduling' ? <Scheduling /> :
           currentView === 'terminal-approvals' && user ? <TerminalApprovals user={user} /> :
           currentView === 'queue' ? <Queue /> :
           <Dashboard />}
        </DashboardWrapper>
      )}
    </AnimatePresence>
  );
}
