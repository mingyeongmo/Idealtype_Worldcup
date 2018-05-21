(function(exports, doc) {
  'use strict'
  function Game(options) {
    this.players = mixPlayers(options.players.map(data => {
      data.eventCallback = this.nextGame.bind(this);
      return new Player(data)
    }));
    this.eventCallback = options.eventCallback;
    this.depth = 1;
    this.maxDepth = getMaxDepth(this.players.length);
    this.prevPlayers = [];
    this.fightPlayers = [];
    this.nextPlayers = [];
    this.playedPlayers = [];
    this.historyDepth = {};
  }

  function mixPlayers(players) {
    return players.sort((a, b) => {return 0.5 - Math.random()});
  }

  function getMaxDepth(length) {
    let depth = 1;
    function calculateDepth(length) {
      if(length / 2 !== 1) {
        depth = depth + 1;
        calculateDepth(length / 2);
      }
    }
    calculateDepth(length);
    return depth;
  }

  Game.prototype.render = function() {
    let $temp = document.createElement('div');
    $temp.innerHTML = `<div class="game">
                        <h1 class="game_title"></h1>
                        <div class="game_players"></div>
                        <button class="game_back_btn"></button>
                      </div>`;
    this.el = $temp.querySelector('.game');
    this.html = this.el.parentNode.innerHTML;
    this.$gameTitle = this.el.querySelector('.game_title');
    this.$gamePlayers = this.el.querySelector('.game_players');
    this.$gameBackBtn = this.el.querySelector('.game_back_btn');
    this.bindEvents();
    this.startGame();
    return this;
  }

  Game.prototype.renderTitle = function() {
    // 갯수만큼 2제곱
    let roundNumber = this.players.length / (this.depth === 1 ? 1 : Math.pow(2, this.depth - 1));
    this.$gameTitle.innerText = roundNumber + '강';
  }

  Game.prototype.renderPlayers = function() {
    this.$gamePlayers.innerHTML = '';
    this.fightPlayers.forEach(player => {
      let $player = doc.createElement('div');
      $player.classList.add('game_player');
      $player.appendChild(player.render().el);
      this.$gamePlayers.appendChild($player)
    });
  }

  Game.prototype.bindEvents = function() {
    this.$gameBackBtn.addEventListener('click', () => {
      this.returnGame();
      this.startGame();
    });
  }

  Game.prototype.nextGame = function(id) {
    this.endGame(id)
    this.startGame();
  }

  Game.prototype.returnGame = function() {
    // round ex)8 -> 16 바뀔때 확인...
    let isChangeRound = !this.players.filter(player => player.played).length;
    if(isChangeRound) {
      this.returnRound();
    }

    // return prevPlayers data
    this.prevPlayers.forEach(prevPlayer => {
      this.players.forEach(player => {
        if(player.id === prevPlayer.id) {
          player.played = false;
          if(this.depth !== player.depth) {
            player.depth = player.depth - 1;
          }
        }
      });
    });
  }

  Game.prototype.endGame = function(winnerId) {
    this.fightPlayers.forEach(player => {
      player.played = true;
      if(player.id === parseInt(winnerId)) {
        player.depth = player.depth + 1;
      }
    });
  }

  Game.prototype.startGame = function() {
    this.renderTitle();
    if(this.depth === this.maxDepth) {
      this.resultGame(this.players.filter(player => player.depth === this.depth + 1)[0]);
      return;
    }
    this.playedPlayers = this.players.filter(player => player.played);

    // playedPlayers 없을시에 players에서 depth 기준 맞춰서 뽑아옴...
    if(!this.playedPlayers.length && this.depth !== 1) {
      this.playedPlayers = this.players.filter(player => this.depth === player.depth || this.depth === player.depth + 1);
    }

    this.prevPlayers = this.playedPlayers.length ? [this.playedPlayers[this.playedPlayers.length - 2], this.playedPlayers[this.playedPlayers.length - 1]] : [];
    this.nextPlayers = this.players.filter(player => (!player.played && this.depth === player.depth));
    // 16 -> 8 -> 4 -> 2
    let isChangeRound = !this.nextPlayers.length;
    if(isChangeRound) {
      this.writeHistory();
      this.nextRound();
    }
    this.fightPlayers = [this.nextPlayers[0], this.nextPlayers[1]];
    this.renderPlayers();
    this.toogleBackBtn();
    this.eventCallback({
      message: 'updateHistory',
      players: this.players
    })
  }

  Game.prototype.returnRound = function() {
    this.depth = this.depth - 1;
    this.players = this.historyDepth[this.depth];
    this.playedPlayers = this.players.filter((player, index) => {
      if(this.depth === player.depth || this.depth + 1 === player.depth) {
        player.played = true;
      }
      return player.played;
    });
    this.prevPlayers = [this.playedPlayers[this.playedPlayers.length - 2], this.playedPlayers[this.playedPlayers.length - 1]];
  }

  Game.prototype.nextRound = function() {
    this.depth = this.depth + 1;
    this.players = mixPlayers(this.players);
    this.nextPlayers = this.players.filter(player => {
      player.played = false;
      return this.depth === player.depth;
    });
    this.renderTitle();
  }

  Game.prototype.writeHistory = function() {
    this.historyDepth[this.depth] = this.players.map(player => {
      let options = Object.assign({}, player);
      return new Player(options);
    });
  }

  Game.prototype.toogleBackBtn = function() {
    if(this.prevPlayers.length) {
      this.$gameBackBtn.style.display = 'block';
    } else {
      this.$gameBackBtn.style.display = 'none';
    }
  }

  Game.prototype.resultGame = function(champion) {
    this.modal = new Modal({
      player: champion,
      eventCallback: this.eventCallback.bind(this, {
        message: 'render'
      })
    });
    this.el.appendChild(this.modal.render().el);
  }

  exports.Game = Game;

})(window, document)