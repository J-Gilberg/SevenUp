import React, { useEffect } from 'react';
import { SocketContext } from './context/Socket';
import { Socket } from './service/Socket';
// import { CoolStuff } from './components/coolStuff';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Dashboard } from './views/Dashboard';
import Game from './views/Game';
import GameLobby from './views/GameLobby';

import './App.css';

function App() {

  useEffect(() => {
  }, []);

  return (
    <SocketContext.Provider value={Socket}>
      <div className="App background">
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <Dashboard />
            </Route>
            <Route exact path='/lobby/:roomCode'>
              <GameLobby />
            </Route>
            <Route exact path="/game">
              <Game />
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    </SocketContext.Provider>
  );
}

export default App;