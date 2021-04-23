const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gallerySchema = new Schema({
  filename: String,
  description: String,
  price: String,
  status: String,
});

const Photo = mongoose.model("Photo", gallerySchema, "Photos");

module.exports = Photo;
