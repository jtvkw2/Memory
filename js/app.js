/*
 * Create a list that holds all of your cards
 */


/*
 * Display the cards on the page
 *   - shuffle the list of cards using the provided "shuffle" method below
 *   - loop through each card and create its HTML
 *  - add each card's HTML to the page
*/

// Shuffle function from http://stackoverflow.com/a/2450976
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


/* set up the event listener for a card. If a card is clicked:
 *  - display the card's symbol (put this functionality in another function that you call from this one)
 *  - add the card to a *list* of "open" cards (put this functionality in another function that you call from this one)
 *  - if the list already has another card, check to see if the two cards match
 *    + if the cards do match, lock the cards in the open position (put this functionality in another function that you call from this one)
 *    + if the cards do not match, remove the cards from the list and hide the card's symbol (put this functionality in another function that you call from this one)
 *    + increment the move counter and display it on the page (put this functionality in another function that you call from this one)
 *    + if all cards have matched, display a message with the final score (put this functionality in another function that you call from this one)
 */


function getImagesUrls(startArray, name, lastIndex){
	baseUrl = "img/icons/";
	names = [];
	baseLen = startArray.length;
	for(i=1; i<=lastIndex; i++){
		startArray[baseLen+i-1] = baseUrl + name + i + ".png";
	}
	return names;
}

function getAllImagesUrls(){
	baseArray = Array();
	getImagesUrls(baseArray, "icon", 20);

	// shuffle array right here, so we don't only get the first images all the time
	shuffle( baseArray );

	return baseArray;
}

function MemoryGame(tbodyElement, clicksSpan, timerSpan){
	this._tbodyElement = tbodyElement;

	this._cardState = 0; // 1 for 1 card up, 2 for 2 cards up
  this._pairs = 0;
	this._cardsTable = null;

	this._showingCard1 = null;
	this._showingCard2 = null;

	this._numClicks = 0;

	this._cardsUrls = getAllImagesUrls();

	this._timerMinutes = 0;
	this._timerSeconds = 0;

	this._clicksSpan = clicksSpan;
	this._timerSpan = timerSpan;
	this._timer = null;
}

MemoryGame.fn = MemoryGame.prototype;

MemoryGame.fn.recreateTable = function(width, height){
	var html = [];

	this._w = width;
	this._h = height;
	var maxBoardSize = this._cardsUrls.length * 2;

	if(width * height > maxBoardSize){
		alert("Not enough images to support this board size (" + width*height + ", max of "+maxBoardSize+")");
		return;
	}

	this.genCardsTable();

	for(var i=0; i<height; i++){
		var line = "<tr>";

		for(var j=0; j<width; j++){
			line += "<td><div id='card_"+
				(i*this._w+j)
				+"' onclick='cardClickHandler(\"" + (i*this._w+j) + "\");'>"
				//+this._cardsTable[i*this._w+j]
				+"</div></td>";
		}
		line += "</tr>";

		html.push(line);
	}

	$(this._tbodyElement).html(html.join(""));
}

MemoryGame.fn.resetGame = function(){
	this.resetTimer();
	this._numClicks = 0;
	this._clicksSpan.html("0");
}

MemoryGame.fn.genCardsTable = function(){
	var linearTable = [];

	for(var i=0; i<(this._h*this._w)/2; i++){
		linearTable[i*2] = linearTable[i*2+1] = i;
	}

	shuffle(linearTable);

	this._cardsTable = linearTable;
}

function padZero10(num){
	if(num < 10){
		return "0"+num;
	}else{
		return ""+num;
	}
}

function MemoryGameTimerUpdater(memogame){
	memogame._timerSeconds += 1;
	if(memogame._timerSeconds >= 60){
		memogame._timerSeconds = 0;
		memogame._timerMinutes += 1;
	}
	s = padZero10(memogame._timerMinutes) + ":" + padZero10(memogame._timerSeconds);
	memogame._timerSpan.html(s);
}

MemoryGame.fn.startTimer = function(){
	if(this._timer)
		return;

	code = "MemoryGameTimerUpdater($('#game_table tbody').data('gameobject'))";
	this._timer = setInterval(code, 1000);
}
MemoryGame.fn.endTime = function(time){
	this._timer = setInterval(time, 1000);
}



MemoryGame.fn.resetTimer = function(){
	if(this._timer)
		clearInterval(this._timer);
	this._timerSpan.html("00:00");
	this._timer = null;
	this._timerSeconds = 0;
	this._timerMinutes = 0;
}

MemoryGame.fn.cardClick = function(cardNum){
	var $cardDiv = $(this._tbodyElement).find('#card_'+cardNum);

	if($cardDiv.hasClass('showingCard') == true){
		// card already showing; nothing to do
		return;
	}

	if(this._numClicks == 0){
		this.startTimer()
	}

	cardImageNum = this._cardsTable[cardNum];

	switch(this._cardState){
	case 0:
		// card not showing
		$cardDiv.addClass('showingCard');

		url = this._cardsUrls[cardImageNum]
		$cardDiv.css('background-image', 'url(' + url + ')')

		this._numClicks += 1;
		this._cardState = 1;
		this._showingCard1 = cardNum;
		break;
	case 1:
		// 1 card showing

		// whether or not it's a match, we set this, otherwise we
		// get a bug when clicking twice on the second card of a match
		$cardDiv.addClass("showingCard");

		// check if match
		if(this._cardsTable[cardNum] == this._cardsTable[this._showingCard1]){
			// if yes -> add class "pairFound"
			$cardDiv.addClass("pairFound");

			$(this._tbodyElement).find('#card_'+this._showingCard1).addClass("pairFound");

			this._cardState = 0;
      this._pairs +=1;
      console.log(this._pairs);
      var winMessage = "You won! \n It took you " + this._timerMinutes+":"+ this._timerSeconds+". \n Would you like to play again?\n ";
      if(this._w == 4 && this._pairs ==  1){
        $('.modal-text').text(winMessage);
        modal.style.display = "block";

        this.resetTimer();
      }
      else if (this._w == 6 && this._pairs == 15) {
        alert("You won!");
        tthis.resetTimer();
      }
      else if (this._w == 8 && this._pairs == 20) {
        alert("You won!");
        this.resetTimer();
      }

		}else{
			// if no -> just leave it showing

			this._showingCard2 = cardNum;
			this._cardState = 2;

		}

		this._numClicks += 1;

		// in either case, we show the image
		url = this._cardsUrls[cardImageNum]
		$cardDiv.css('background-image', 'url(' + url + ')')

		break;
	case 2:
		// 2 cards showing

		// just close the two cards and go back to state = 1 card showing
		card1 = $(this._tbodyElement).find('#card_'+this._showingCard1);
		card1.removeClass("showingCard");
		card1.css('background-image', '');

		card2 = $(this._tbodyElement).find('#card_'+this._showingCard2);
		card2.removeClass("showingCard");
		card2.css('background-image', '');

		this._showingCard1 = this._showingCard2 = null;

		this._cardState = 0;

		break;
	}

	this._clicksSpan.html(this._numClicks);
stars(this._numClicks);
}

// taken at http://www.peterbe.com/plog/isint-function
function isInt(x) {
	var y=parseInt(x);
	if (isNaN(y)) return false;
	return x==y && x.toString()==y.toString();
}

function startOverCallback(w, h){
	if(!isInt(w) || !isInt(h)){
		alert("Fields must contain integers");
		return;
	}

	w = parseInt(w);
	h = parseInt(h);

	if((w * h) % 2 == 1){
		alert("width * height must not be odd (we need pairs)");
		return;
	}

	var game = $('#game_table tbody').data('gameobject');

	game.resetGame();

	game.recreateTable(w, h);
}

function cardClickHandler(cardNum){
	$('#game_table tbody').data('gameobject').cardClick(cardNum);
}

$(function(){
	var game = new MemoryGame($('#game_table tbody'), $('#num_clicks'), $('#timer'));

	game.recreateTable(4,4);

	$('#game_table tbody').data('gameobject', game);
});

function stars(clicks){
  if(clicks > 100){
    $(".star2").hide();
    $(".star3").hide();
  }
  else if(clicks > 50){
    $(".star3").hide();
  }

}

// Get the modal
var modal = document.getElementById('myModal');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
