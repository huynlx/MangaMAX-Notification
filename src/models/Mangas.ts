import mongoose from 'mongoose';

const MangaSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      require: true
    },
    latestChapter: {
      type: String,
      require: true
    },
    title: {
      type: String,
      require: true
    },
    cover: {
      type: String,
      require: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("mangas", MangaSchema);

export interface MangaType {
  _id: string,
  latestChapter: string,
  title: string,
  cover: string;
}