var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Poll = new Schema({
    data: [Number],
    labels: {
        type: [String],
        set: function(labels){
            return labels.split(",");
        }
    },
    createdBy: String,
    title: String
});

module.exports = mongoose.model('Poll', Poll);