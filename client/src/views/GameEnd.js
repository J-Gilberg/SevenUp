import React from 'react';
import { useHistory } from 'react-router-dom';


const gameEnd = (props) => {
    const history = useHistory();

    const onClickHandler = e => {
        e.preventDefault();
        history.pushState('/')
    }

    if ('guy with lowest points') {
        return (
            <div>
                <h1>Congrats. You win</h1>
                <button onClick={onClickHandler}>Play Again</button>
            </div>
        )
    } else {
        return (
            <div>
                <h1>Boo. You stink. Like Justin's project</h1>
                <button onClick={onClickHandler}>Play Again</button>
            </div>
        )
    }

}