import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    mangaId: {
      type: String,
      require: true,
      ref: "mangas"
    },
    endpoint: {
      type: String,
      require: true
    },
    p256dh: {
      type: String,
      require: true
    },
    auth: {
      type: String,
      require: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("subscriptión", SubscriptionSchema);

export interface SubscriptionType {
  mangaId: string,
  endpoint: string,
  p256dh: string,
  auth: string;
}