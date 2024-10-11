import { Meteor } from 'meteor/meteor';
import { Scores } from '../imports/collections';


Meteor.startup(() => {
  // code to run on server at startup
});

//scores are
  //_id: score._id,
    //  title: title,
      //composer: composer,
      //arranger: arranger,
      //voiceType: voiceType,
      //number_of_copies: number_of_copies,
      //number_of_originals: number_of_originals,
      //library_number: library_number,
      //section: section,
      //tags: tags,
      //notes: notes,

Meteor.methods({
  //method to log to server console
  'serverConsole': function(message){
    console.log("Client message: " + message);
  },
  // method to add scores
  'addScore': function(score) {
    console.log("Adding score: " + score.title, score.composer, score.lyricist, score.voiceType, score.number_of_copies, score.notes);
    // insert the score into the database
    Scores.insertAsync({
      title: score.title,
      composer: score.composer,
      arranger: score.arranger,
      voiceType: score.voiceType,
      number_of_copies: score.number_of_copies,
      number_of_originals: score.number_of_originals,
      library_number: score.library_number,
      section: score.section,
      tags: score.tags,
      notes: score.notes,

    });
    return "Score added";
  },
  'deleteScore': function(scoreId) {
    console.log("Deleting score: " + scoreId);
    Scores.removeAsync({_id: scoreId});
    return "Score deleted";
  },
  'updateScore': function(score) {
    console.log("Updating score: " + score._id);
    Scores.updateAsync({_id: score._id}, {
      title: score.title,
      composer: score.composer,
      arranger: score.arranger,
      voiceType: score.voiceType,
      number_of_copies: score.number_of_copies,
      number_of_originals: score.number_of_originals,
      library_number: score.library_number,
      section: score.section,
      tags: score.tags,
      notes: score.notes,
      
      
      
    });
    return "Score updated";
  }
})