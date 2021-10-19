import {buildDeck} from ("../Server/server");

const test = () => {
    

var assert = require('assert');
describe('Array', function () {
    describe('#BuildDeckLength', function () {
        it('should return 53 when 4 players are in the game', function () {
            assert.equal(buildDeck(4).length, 53);
        });
    });
});

describe('Array', function () {
    describe('#ShuffleLength', function () {
        it('should return 53 when 4 players are in the game', function () {
            assert.equal(server.shuffle(server.buildDeck(4)).length, 53);
        });
    });
});

describe('Array', function () {
    describe('#ShuffleVariables', function () {
        it('should return 0, variable has then been created', function () {
            assert.equal(server.shuffle(server.buildDeck(4))[53].playerId, 0);
        });
    });
});

}