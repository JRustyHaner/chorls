import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import './main.html';

Scores = new Mongo.Collection('scores');


Template.input.onCreated(function() {
  //subscribe to the scores publication
  Meteor.subscribe('scores');
});

Template.viewAll.helpers({
  //all scores
  scores() {
    scores = Scores.find({}).fetch();
    console.log(scores);
    return scores;
  },
});

Template.input.events({
  //input_title, input_composer, input_lyricist, input_fuchs, input_number_of_copies, input_notes
  'click #submit_new_score'(event, instance) {
    //prevent the default event
    event.preventDefault();
    console.log("submitting new score");
    //make a meteor async call to add a score. An object with the following fields should be passed to the method:
    //title, composer, lyricist, fuchs, number_of_copies, notes. we get that from the input fields
    //the fuchs scale are from input_soprano, input_alto, input_tenor, input_bass. if soprano
    fuchs = ""
    if (document.getElementById('input_soprano').checked) {
      fuchs += "S"
    }
    if (document.getElementById('input_alto').checked) {
      fuchs += "A"
    }
    if (document.getElementById('input_tenor').checked) {
      fuchs += "T"
    }
    if (document.getElementById('input_bass').checked) {
      fuchs += "B"
    }
    console.log(document.getElementById('input_title').value, document.getElementById('input_composer').value, document.getElementById('input_lyricist').value, fuchs, document.getElementById('input_number_of_copies').value, document.getElementById('input_notes').value);
    Meteor.call('addScore', {
      title: document.getElementById('input_title').value,
      composer: document.getElementById('input_composer').value,
      lyricist: document.getElementById('input_lyricist').value,
      fuchs: fuchs,
      number_of_copies: document.getElementById('input_number_of_copies').value,
      notes: document.getElementById('input_notes').value,
    }, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
  },
});
