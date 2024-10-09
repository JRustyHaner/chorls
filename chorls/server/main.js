import { Meteor } from 'meteor/meteor';
import { Scores } from '../imports/collections';


Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
  //method to log to server console
  'serverConsole': function(message){
    console.log("Client message: " + message);
  },
  // method to add scores
  'addScore': function(score) {
    console.log("Adding score: " + score.title, score.composer, score.lyricist, score.fuchs, score.number_of_copies, score.notes);
    // insert the score into the database
    Scores.insertAsync({
      title: score.title,
      composer: score.composer,
      lyricist: score.lyricist,
      fuchs: score.fuchs,
      number_of_copies: score.number_of_copies,
      notes: score.notes,
    });
    return "Score added";
  },
})