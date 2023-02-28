import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import Home from "./pages/Home";
import Room from './pages/Room';
import SocketProvider from "./providers/Socket.Provider";
import PeerProvider from './providers/Peer.Provider';

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <PeerProvider>
          <Router>
              <Routes>
                  <Route path="/" element={<Home />} exact/>
                  <Route path="/room/:roomId" element={<Room />} exact/>
              </Routes> 
          </Router>
          </PeerProvider>
      </SocketProvider>    
    </div> 
  );
}

export default App;
 