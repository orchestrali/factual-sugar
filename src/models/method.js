var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var methodSchema = new Schema ({
  title: String,
  oldtitle: [String],
  name: String,
  stage: { type: Number, min: 3, max: 33, required: true },
  classification: {
    little: Boolean,
    differential: Boolean,
    plain: Boolean,
    trebleDodging: Boolean
  },
  class: { type: String, enum: ['Bob', 'Place', 'Treble Bob', 'Treble Place', 'Delight', 'Surprise', 'Alliance', 'Hybrid', 'Differential', 'Principle', 'Unclassified', 'Jump'] },
  leadLength: { type: Number, min: 1 },
  leadHead: String,
  leadHeadCode: String,
  numHunts: Number,
  huntBells: [Number],
  huntPath: [Number],
  stationaryBells: [Number],
  numWorking: Number,
  pbOrder: [],
  leadsInCourse: Number,
  fchGroups: String,
  symmetry: [String],
  pn: String,
  pnFull: [],
  calls: [{ type: Schema.Types.ObjectId, ref: 'call' }],
  leadtruth: Boolean,
  coursetruth: Boolean,
  ccNum: Number,
  refs: {
    rwRef: String,
    tdmm: String,
    pmm: String
  },
  performances: [{ type: Schema.Types.ObjectId, ref: 'performance' }],
  notes: String
});

module.exports = mongoose.model('method', methodSchema);
